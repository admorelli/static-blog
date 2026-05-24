// +----------------------------------------------------+
// | Dark/Light mode toggle button                        |
// +----------------------------------------------------+
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost">
      🌓
    </Button>
  );
}
