// +----------------------------------------------------+
// | Top navigation bar                                  |
// +----------------------------------------------------+
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/lib/theme-toggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <nav className="mr-2 flex gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Blog</span>
          </Link>
          <Link
            href="/posts"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            Posts
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/new-post">New Post</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
