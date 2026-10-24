"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "white" | "black";

function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem("bhoomi-theme");
    if (saved === "black" || saved === "dark") return "black";
    if (saved) return "white";
  } catch {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "black" : "white";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "black" : "white";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("white");

  useEffect(() => {
    const initialTheme = readTheme();
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function chooseTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("bhoomi-theme", nextTheme);
    } catch {
      // Keep the selected theme for this session if browser storage is unavailable.
    }
  }

  return (
    <button
      aria-label={`Switch to ${theme === "black" ? "light" : "dark"} mode`}
      aria-pressed={theme === "black"}
      className="icon-button theme-toggle"
      onClick={() => chooseTheme(theme === "black" ? "white" : "black")}
      title={`Switch to ${theme === "black" ? "light" : "dark"} mode`}
      type="button"
    >
      {theme === "black" ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
