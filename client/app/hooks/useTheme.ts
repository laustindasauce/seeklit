import { useEffect, useState } from "react";
import { localApi } from "../lib/localApi";

export type Theme = "light" | "dark" | "system";

export function useTheme(user?: User | null) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from server on mount if user is authenticated
  useEffect(() => {
    const loadThemeFromServer = async () => {
      try {
        if (user?.accessToken) {
          const preferences = await localApi.getUserPreferences(
            user.accessToken
          );
          if (preferences.theme) {
            setTheme(preferences.theme);
            localStorage.setItem("theme", preferences.theme);
          }
        }
      } catch (error) {
        console.debug("Could not load theme from server:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemeFromServer();
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (newTheme: Theme) => {
      root.classList.remove("light", "dark");

      if (newTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(newTheme);
      }
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);

    // Save to server if loaded and user is authenticated
    if (isLoaded && user?.accessToken) {
      const saveThemeToServer = async () => {
        try {
          await localApi.updateUserPreferences(user.accessToken, { theme });
        } catch (error) {
          console.debug("Could not save theme to server:", error);
        }
      };

      saveThemeToServer();
    }

    // Listen for system theme changes when theme is set to system
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, isLoaded, user]);

  return { theme, setTheme };
}
