import { useMatches } from "@remix-run/react";
import { useEffect, useState } from "react";
import { UniversalBook } from "./components/UniversalBookShelf";

// Type guard to verify if an object is a User
function isUser(user: unknown): user is User {
  return (
    typeof user === "object" &&
    user !== null &&
    "username" in user &&
    typeof (user as User).username === "string"
  );
}

export const isAdmin = (user: User | undefined): boolean =>
  user?.type === "root" || user?.type === "admin";

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

export const transformAbsBook = (
  book: BookItem,
  absBaseUrl: string
): UniversalBook => ({
  id: `ABS_${book.libraryItem.id}`,
  title: book.libraryItem.media.metadata.title,
  author: book.libraryItem.media.metadata.authorName,
  coverUrl: `${absBaseUrl}/api/items/${book.libraryItem.id}/cover`,
  infoLink: `${absBaseUrl}/item/${book.libraryItem.id}`,
  source: "ABS",
  source_id: book.libraryItem.id,
  isAudiobook: book.libraryItem.media.numAudioFiles > 0,
});

export const transformGoogleBook = (book: GoogleBook): UniversalBook => ({
  id: `GOOGLE_${book.id}`,
  title: book.volumeInfo.title,
  author: book.volumeInfo.authors?.join(", ") || null,
  coverUrl:
    book.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") || null,
  infoLink: book.volumeInfo.infoLink || null,
  source: "GOOGLE",
  source_id: book.id,
  isbn_10:
    book.volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_10")
      ?.identifier || null,
  isbn_13:
    book.volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_13")
      ?.identifier || null,
  description: book.volumeInfo.description || null,
  isAudiobook: false,
});

export const transformOpenLibraryBook = (
  book: OpenLibraryBook
): UniversalBook => ({
  id: `OPENLIBRARY_${book.info_link?.split("/").pop() || book.title}`,
  title: book.title,
  author: book.author_name?.join(", ") || null,
  coverUrl: book.cover_images?.medium || null,
  infoLink: book.info_link || null,
  source: "OPENLIBRARY",
  source_id: book.info_link?.split("/").pop() || "none",
  description: null,
  isAudiobook: false,
});

export const transformHardcoverBook = (book: HardcoverBook): UniversalBook => ({
  id: `HARDCOVER_${book.id}`,
  title: book.title,
  author: book.contributions?.[0]?.author.name || null,
  coverUrl: book.images?.[0]?.url || null,
  infoLink: `https://hardcover.app/books/${book.slug}`,
  source: "HARDCOVER",
  source_id: book.id.toString(),
  isbn_10: book.default_physical_edition?.isbn_10 || null,
  isbn_13: book.default_physical_edition?.isbn_13 || null,
  description: book.description || null,
  isAudiobook: false,
});
