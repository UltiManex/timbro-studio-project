import Link from 'next/link';
import { Logo } from '@/components/icons';
import { SidebarNav } from './sidebar-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function Sidebar() {
  // Mock data for trial status
  const trialDaysLeft = 5;
  const trialMinutesUsed = 15;
  const trialMinutesTotal = 30;
  const minutesProgress = (trialMinutesUsed / trialMinutesTotal) * 100;

  return (
    <div className="hidden border-r bg-sidebar md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo />
          </Link>
        </div>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <div className="mt-auto p-4">
          <Card x-chunk="dashboard-02-chunk-0">
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle className="text-lg">Free Trial</CardTitle>
              <CardDescription>
                {trialDaysLeft} days left. You've used {trialMinutesUsed} of {trialMinutesTotal} processing minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Progress value={minutesProgress} aria-label={`${minutesProgress}% of trial minutes used`} className="mb-2"/>
              <Button size="sm" className="w-full">
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
