
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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle, RotateCcw, Check } from 'lucide-react';
import { ToneIcon } from '@/components/icons';
import { AVAILABLE_TONES } from '@/lib/constants';
import type { Tone, SoundEffectInstance } from '@/lib/types';

interface ReanalyzeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentTone: Tone;
  isReanalyzing: boolean;
  onInitiateReanalysis: (newTone: Tone) => void;
  preReanalysisEffects: SoundEffectInstance[] | null;
  onConfirmChanges: () => void;
  onRevert: () => void;
}

export function ReanalyzeModal({
  isOpen,
  onOpenChange,
  currentTone,
  isReanalyzing,
  onInitiateReanalysis,
  preReanalysisEffects,
  onConfirmChanges,
  onRevert,
}: ReanalyzeModalProps) {
  const [selectedTone, setSelectedTone] = useState<Tone | undefined>(undefined);

  // When the modal opens, reset the internal tone selection
  useEffect(() => {
    if (isOpen) {
      setSelectedTone(undefined);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedTone) {
      onInitiateReanalysis(selectedTone);
    }
  };
  
  const availableTones = AVAILABLE_TONES.filter(t => t !== currentTone);
  const isInReviewMode = preReanalysisEffects !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Re-Analyze Project
          </DialogTitle>
          <DialogDescription>
            {isInReviewMode
              ? "Re-analysis complete. You can confirm these new changes or revert to the previous version."
              : `Choose a new tone to generate different AI suggestions. Your current tone is ${currentTone}.`}
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
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="reanalyze-tone-select">New Analysis Tone</Label>
              <Select onValueChange={(value) => setSelectedTone(value as Tone)} value={selectedTone}>
                <SelectTrigger id="reanalyze-tone-select" className="w-full mt-1">
                  <SelectValue placeholder="Select a new tone" />
                </SelectTrigger>
                <SelectContent>
                  {availableTones.map((tone) => (
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
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This will remove all existing AI-generated suggestions and replace them with new ones. Any effects you added manually will be preserved.
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
              <Button onClick={handleConfirm} disabled={!selectedTone}>
                Confirm & Re-Analyze
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    