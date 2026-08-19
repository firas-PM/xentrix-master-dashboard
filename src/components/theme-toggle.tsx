"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "xentrix-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* localStorage disabled — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/** Runs before hydration to prevent a flash of the wrong theme. */
export const themeInitScript = `
  (function() {
    try {
      var t = localStorage.getItem('${KEY}');
      if (t === 'dark') document.documentElement.setAttribute('data-theme','dark');
    } catch(_) {}
  })();
`;
