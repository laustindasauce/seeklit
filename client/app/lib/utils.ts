import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Check and replace environment value if needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getEnvVal = (envVal: any, def: string): string => {
  // Check if the value is null, undefined, empty, or still a baked placeholder
  if (!envVal || typeof envVal !== "string" || envVal.startsWith("BAKED_")) {
    return def; // Return the default value
  }

  return envVal; // Return the valid environment value
};

export const isSensitiveKey = (key: string) => {
  const sensitiveKeywords = ["key", "api", "token", "secret", "password"];
  return sensitiveKeywords.some((keyword) =>
    key.toLowerCase().includes(keyword)
  );
};
