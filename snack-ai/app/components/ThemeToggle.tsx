"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) {
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
        if (stored === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        // ensure state matches actual class
        setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
      } else {
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = prefersDark ? "dark" : "light";
        setTheme(initial);
        document.documentElement.setAttribute("data-theme", initial);
        if (initial === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }
  return (
    <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle color theme">
      <input
        type="checkbox"
        className="sr-only peer"
        onChange={toggle}
        checked={theme === "dark"}
        aria-checked={theme === "dark"}
      />
      <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-green-400 dark:peer-focus:ring-green-500 peer-checked:bg-green-500 transition-colors"></div>
      <div className="absolute left-1 top-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow transform peer-checked:translate-x-6 transition-transform flex items-center justify-center text-sm">
        {theme === "dark" ? "🌙" : "☀️"}
      </div>
    </label>
  );
}
