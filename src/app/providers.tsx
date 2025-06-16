"use client";

import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // This is a good place to add context providers if your app needs them.
  // For example, ThemeProvider, QueryClientProvider, etc.
  return <>{children}</>;
}
