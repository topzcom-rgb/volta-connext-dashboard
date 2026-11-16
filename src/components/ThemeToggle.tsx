import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดกลางคืน (Dark Mode)'}
      aria-label="Toggle dark mode theme"
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D288A] dark:focus-visible:ring-[#B975DB] ${
        isDark
          ? 'bg-[#1D1528] hover:bg-[#281D38] text-[#E2B95B] border-[#E2B95B]/30'
          : 'bg-white hover:bg-slate-50 text-[#6D288A] border-slate-200'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#E2B95B]" />
      ) : (
        <Moon className="w-4 h-4 text-[#6D288A]" />
      )}
    </button>
  );
}
