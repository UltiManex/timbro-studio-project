
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { ToneIcon } from '@/components/icons';
import { AVAILABLE_TONES } from '@/lib/constants';
import type { Tone } from '@/lib/types';

interface ReanalyzeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentTone: Tone;
  isReanalyzing: boolean;
  onConfirm: (newTone: Tone) => void;
}

export function ReanalyzeModal({
  isOpen,
  onOpenChange,
  currentTone,
  isReanalyzing,
  onConfirm,
}: ReanalyzeModalProps) {
  const [selectedTone, setSelectedTone] = useState<Tone | undefined>(undefined);

  const handleConfirm = () => {
    if (selectedTone) {
      onConfirm(selectedTone);
      // The modal will be closed by the parent component after the process starts
    }
  };
  
  // Exclude the current tone from the list of options
  const availableTones = AVAILABLE_TONES.filter(t => t !== currentTone);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Re-Analyze Project
          </DialogTitle>
          <DialogDescription>
            Choose a new tone to generate a different set of AI sound effect suggestions.
            Your current tone is <strong>{currentTone}</strong>.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isReanalyzing}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isReanalyzing || !selectedTone}>
            {isReanalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isReanalyzing ? 'Analyzing...' : 'Confirm & Re-Analyze'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
