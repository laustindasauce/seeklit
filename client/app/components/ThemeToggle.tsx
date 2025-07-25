import { Moon, Sun, Monitor } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { useTheme, type Theme } from "../hooks/useTheme";
import { useOptionalUser } from "../utils";

const themeOptions = [
  {
    value: "light" as Theme,
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark" as Theme,
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system" as Theme,
    label: "System",
    icon: Monitor,
  },
];

export function ThemeToggle() {
  const user = useOptionalUser();
  const { theme, setTheme } = useTheme(user);

  const currentTheme = themeOptions.find((option) => option.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
      <SelectTrigger className="w-auto px-3 gap-2">
        <CurrentIcon className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          {currentTheme?.label}
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
