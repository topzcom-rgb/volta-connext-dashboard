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
      className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer border shrink-0 ${
        isDark 
          ? 'bg-[#251a33] hover:bg-[#342447] text-[#deb965] border-[#deb965]/40 shadow-xs shadow-[#deb965]/20 hover:scale-105 active:scale-95' 
          : 'bg-white hover:bg-slate-100 text-[#7F3F98] border-[#7F3F98]/20 shadow-2xs hover:scale-105 active:scale-95'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#deb965] transition-all duration-300 rotate-0 hover:rotate-90 animate-in fade-in" />
      ) : (
        <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#7F3F98] transition-all duration-300 -rotate-12 hover:rotate-0 animate-in fade-in" />
      )}
    </button>
  );
}
