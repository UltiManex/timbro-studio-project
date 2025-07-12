
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { OnboardingStep } from '@/lib/types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const initialSteps: OnboardingStep[] = [
  { id: 'welcome', title: 'Welcome to Timbro!', description: 'Let\'s get you started on your audio journey.', isCompleted: false },
  { id: 'create', title: 'Create Your First Project', description: 'Upload your audio and let Timbro work its magic.', isCompleted: false, actionPath: '/projects/new' },
  { id: 'review', title: 'Review AI Suggestions', description: 'Explore the interactive editor and fine-tune your sound effects.', isCompleted: false, actionPath: '/dashboard' }, // Path to dashboard, user selects a project from there.
  { id: 'export', title: 'Export Your Masterpiece', description: 'Download your professionally enhanced audio.', isCompleted: false, actionPath: '/dashboard' }, // Path to dashboard
];

interface OnboardingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function OnboardingModal({ isOpen, onOpenChange }: OnboardingModalProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // This effect could be used to load saved progress from localStorage if desired
    // For now, it just ensures the modal is controlled by the isOpen prop.
    if (isOpen && currentStepIndex === 0 && !steps[0].isCompleted) {
      // Mark welcome step as completed immediately if not already.
      handleStepCompletion(0, true, false); // Don't navigate for welcome
    }
  }, [isOpen]);
  
  const handleStepCompletion = (index: number, completed: boolean, navigate: boolean = true) => {
    const newSteps = [...steps];
    newSteps[index].isCompleted = completed;
    setSteps(newSteps);

    if (completed && navigate && newSteps[index].actionPath) {
        router.push(newSteps[index].actionPath as string);
        // Modal might close upon navigation. Consider if this is desired behavior.
        // onOpenChange(false); 
    }
    
    if (completed && index < steps.length - 1) {
      setCurrentStepIndex(index + 1);
    }
  };

  const activeStep = steps[currentStepIndex];
  const progressPercentage = (steps.filter(s => s.isCompleted).length / steps.length) * 100;

  if (!activeStep) { // All steps completed
      return null; // Or a "Congratulations" message before closing.
  }

  const handleNextOrAction = () => {
    if (activeStep.actionPath && !activeStep.isCompleted) {
      handleStepCompletion(currentStepIndex, true, true);
    } else if (currentStepIndex < steps.length - 1) {
      handleStepCompletion(currentStepIndex, true, false); // Mark current as complete, move to next
      setCurrentStepIndex(currentStepIndex + 1);
    } else { // Last step
      handleStepCompletion(currentStepIndex, true, false);
      onOpenChange(false); // Close modal
    }
  };
  
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-center">{activeStep.title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {activeStep.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <Progress value={progressPercentage} className="w-full" aria-label={`Onboarding progress, ${Math.round(progressPercentage)}% complete`} />
            <ul className="space-y-3">
                {steps.map((step, index) => (
                <li key={step.id} className={`flex items-center p-3 rounded-md transition-all ${index === currentStepIndex ? 'bg-primary/10 border border-primary/50' : 'bg-muted/50'}`}>
                    <Checkbox
                        id={`step-${step.id}`}
                        checked={step.isCompleted}
                        onCheckedChange={(checked) => handleStepCompletion(index, !!checked, index === currentStepIndex && !!activeStep.actionPath)}
                        className="mr-3"
                        aria-label={step.title}
                        disabled={index > currentStepIndex && !steps[index-1]?.isCompleted}
                    />
                    <Label htmlFor={`step-${step.id}`} className={`flex-1 text-sm ${step.isCompleted ? 'line-through text-muted-foreground' : ''} ${index === currentStepIndex ? 'font-semibold text-primary' : ''}`}>
                    {step.title}
                    </Label>
                    {step.isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />}
                </li>
                ))}
            </ul>
        </div>

        <DialogFooter className="sm:justify-between items-center">
          <span className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</span>
          <Button onClick={handleNextOrAction}>
            {activeStep.actionPath && !activeStep.isCompleted ? `Go to: ${activeStep.title}` : (isLastStep && activeStep.isCompleted ? 'Finish Onboarding' : 'Next')}
            {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
