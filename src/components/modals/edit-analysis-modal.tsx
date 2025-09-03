
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle, RotateCcw, Check, Info } from 'lucide-react';
import { ToneIcon } from '@/components/icons';
import { AVAILABLE_TONES, AVAILABLE_EFFECT_PLACEMENTS } from '@/lib/constants';
import type { Tone, SoundEffectInstance, DefaultEffectPlacement, AnalysisSettings } from '@/lib/types';

interface EditAnalysisModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentTone: Tone;
  currentPlacement: DefaultEffectPlacement;
  isReanalyzing: boolean;
  onUpdateAnalysis: (settings: AnalysisSettings) => void;
  preReanalysisEffects: SoundEffectInstance[] | null;
  onConfirmChanges: () => void;
  onRevert: () => void;
}

export function EditAnalysisModal({
  isOpen,
  onOpenChange,
  currentTone,
  currentPlacement,
  isReanalyzing,
  onUpdateAnalysis,
  preReanalysisEffects,
  onConfirmChanges,
  onRevert,
}: EditAnalysisModalProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>(currentTone);
  const [selectedPlacement, setSelectedPlacement] = useState<DefaultEffectPlacement>(currentPlacement);
  const [dynamicSummary, setDynamicSummary] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  // When the modal opens, reset the internal state to match the current project
  useEffect(() => {
    if (isOpen) {
      setSelectedTone(currentTone);
      setSelectedPlacement(currentPlacement);
      setIsDirty(false);
    }
  }, [isOpen, currentTone, currentPlacement]);

  // Update dynamic summary when selections change
  useEffect(() => {
    if (!isOpen) return;

    const toneChanged = selectedTone !== currentTone;
    const placementChanged = selectedPlacement !== currentPlacement;

    if (!toneChanged && !placementChanged) {
        setIsDirty(false);
        setDynamicSummary('No changes selected. Choose a new tone or placement strategy to update.');
        return;
    }
    
    setIsDirty(true);
    let summary = '';
    if (placementChanged && selectedPlacement === 'manual-only') {
        summary = 'Warning: This will remove all AI-generated sound effects from the timeline.';
    } else if (toneChanged && placementChanged) {
        summary = `This will generate new '${selectedTone}' suggestions using the '${selectedPlacement === 'ai-optimized' ? 'AI-Optimized' : 'Manual'}' strategy.`;
    } else if (toneChanged) {
        summary = `This will generate new '${selectedTone}' suggestions.`;
    } else if (placementChanged) {
        summary = `The timeline will be updated using the '${selectedPlacement === 'ai-optimized' ? 'AI-Optimized' : 'Manual'}' placement strategy.`;
    }
    setDynamicSummary(summary);
    
  }, [selectedTone, selectedPlacement, currentTone, currentPlacement, isOpen]);

  const handleConfirm = () => {
    if (isDirty) {
      onUpdateAnalysis({ tone: selectedTone, placement: selectedPlacement });
    }
  };
  
  const isInReviewMode = preReanalysisEffects !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Edit Project Analysis
          </DialogTitle>
          <DialogDescription>
            {isInReviewMode
              ? "Update complete. You can confirm these new changes or revert to the previous version."
              : `Change the analysis tone or the effect placement strategy.`}
          </DialogDescription>
        </DialogHeader>

        {isReanalyzing ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground font-medium">Analyzing your audio...</p>
            <p className="text-sm text-muted-foreground">This may take a moment.</p>
          </div>
        ) : isInReviewMode ? (
          <div className="py-4 text-center">
            <Check className="h-16 w-16 text-green-500 bg-green-100 dark:bg-green-900/30 rounded-full p-2 mx-auto" />
            <p className="mt-4 text-muted-foreground">Your project has been updated with new suggestions.</p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reanalyze-tone-select">Analysis Tone</Label>
              <Select onValueChange={(value) => setSelectedTone(value as Tone)} value={selectedTone}>
                <SelectTrigger id="reanalyze-tone-select" className="w-full">
                  <SelectValue placeholder="Select a new tone" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TONES.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      <div className="flex items-center">
                        {tone === 'All' ? <Sparkles className="mr-2 h-5 w-5" /> : <ToneIcon tone={tone as Exclude<Tone, 'All'>} className="mr-2 h-5 w-5" />}
                        {tone === 'All' ? 'All Effects (Flexible)' : tone}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
                <Label>Effect Placement Strategy</Label>
                <RadioGroup
                    onValueChange={(value) => setSelectedPlacement(value as DefaultEffectPlacement)}
                    value={selectedPlacement}
                    className="space-y-2"
                >
                    {AVAILABLE_EFFECT_PLACEMENTS.map((placement) => (
                    <div key={placement.value} className="flex items-start space-x-2 p-3 border rounded-md hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value={placement.value} id={placement.value} className="mt-1"/>
                        <div className="flex-1">
                           <Label htmlFor={placement.value} className="font-medium cursor-pointer">{placement.label}</Label>
                           {placement.description && <p className="text-xs text-muted-foreground">{placement.description}</p>}
                        </div>
                    </div>
                    ))}
                </RadioGroup>
            </div>
             <Alert variant={selectedPlacement === 'manual-only' && isDirty ? 'destructive' : 'default'}>
              {selectedPlacement === 'manual-only' && isDirty ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              <AlertTitle>{selectedPlacement === 'manual-only' && isDirty ? 'Warning' : 'Summary of Changes'}</AlertTitle>
              <AlertDescription>
                {dynamicSummary}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {isReanalyzing ? null : isInReviewMode ? (
            <>
              <Button type="button" variant="outline" onClick={onRevert}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert Changes
              </Button>
              <Button onClick={onConfirmChanges}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!isDirty}>
                Update Analysis
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    