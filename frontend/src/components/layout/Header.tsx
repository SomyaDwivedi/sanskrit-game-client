import React, { useState, useEffect } from "react";
import Logo from "../common/Logo";

interface HeaderProps {
  gameCode?: string;
  timer?: string;
}

// Custom hook for theme management
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";

    const stored = localStorage.getItem("theme");
    if (stored) return stored;

    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      root.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    }
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "light" : "dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
};

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span className="theme-toggle-icon sun-icon">☀</span>
      <span className="theme-toggle-icon moon-icon">🌙</span>
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ gameCode, timer }) => {
  return (
    <header className="glass-card header-card p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />

        {gameCode && (
          <div className="text-center">
            <div className="text-sm opacity-80">Game Code</div>
            <div className="text-2xl font-mono font-bold gradient-text-primary">
              {gameCode}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {timer && (
            <div className="timer-display">
              <span className="text-sm opacity-80">Time</span>
              <span className="text-xl font-bold ml-2">{timer}</span>
            </div>
          )}

          {/* Theme Toggle Switch */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;