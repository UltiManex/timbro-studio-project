'use client';
// This page would be very similar to the dashboard page,
// but potentially with more advanced filtering, sorting, or bulk actions.
// For V1, it can redirect to the dashboard or reuse much of its logic.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AllProjectsPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, let's just redirect to the dashboard.
    // In a future version, this could be a distinct page.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <p>Loading all projects...</p>
    </div>
  );
}
