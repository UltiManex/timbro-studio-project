
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, PlusCircle, Settings, LifeBuoy, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarNavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'All Projects', icon: FolderKanban },
  { href: '/projects/new', label: 'New Project', icon: PlusCircle, variant: 'primary' as const },
];

const bottomNavItems = [
  { href: '/billing', label: 'Billing & Subscription', icon: ShoppingBag },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: LifeBuoy },
];

export function SidebarNav({ isMobile = false, onLinkClick }: SidebarNavProps) {
  const pathname = usePathname();

  const renderNavItem = (item: typeof navItems[0] | typeof bottomNavItems[0]) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onLinkClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary',
          item.variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
           item.variant === 'primary' && isActive && 'bg-primary/90'
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className={cn("grid items-start gap-2 text-sm font-medium", isMobile ? "p-4" : "px-2 lg:px-4")}>
      {navItems.map(renderNavItem)}
      {!isMobile && <div className={cn("my-4 border-t border-border", "-mx-2 lg:-mx-4")} />}
      {bottomNavItems.map(renderNavItem)}
    </nav>
  );
}
