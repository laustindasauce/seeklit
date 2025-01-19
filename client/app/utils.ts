import { useMatches } from "@remix-run/react";
import { useEffect, useState } from "react";

// Type guard to verify if an object is a User
function isUser(user: unknown): user is User {
  return (
    typeof user === "object" &&
    user !== null &&
    "username" in user &&
    typeof (user as User).username === "string"
  );
}

// Hook to optionally get the user from the Remix root loader data.
export function useOptionalUser(): User | undefined {
  const matches = useMatches();
  const route = matches.find((match) => match.id === "root");

  // Define the expected data type for `route?.data`
  const data = route?.data as { user?: User | null } | undefined;
  if (!data || !isUser(data.user)) {
    return undefined;
  }

  return data.user;
}

// Custom hook for debouncing
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if the value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}