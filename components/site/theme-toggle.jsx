'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className={`theme-toggle ${className}`.trim()} type="button" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
    </button>
  );
}