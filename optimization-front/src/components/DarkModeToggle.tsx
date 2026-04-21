import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DarkModeToggleProps {
  className?: string;
}

export default function DarkModeToggle({ className = 'fixed bottom-32 right-4 z-50' }: DarkModeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        background: isDark ? '#28251f' : '#1c1a17',
        border: `1.5px solid ${isDark ? '#3a3630' : 'rgba(255,255,255,0.12)'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.15s',
        color: isDark ? '#f5c06a' : '#8a7d6a',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  );
}
