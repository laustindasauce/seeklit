/* eslint-disable import/no-unresolved */
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, BookOpen } from "lucide-react";
import RequestPrompt from "./RequestPrompt";

interface BookShelfProps {
  searchResults?: HardcoverBook[];
  onRequestBook?: (req: NewBookRequest) => Promise<void>;
  users: User[];
}

export default function HardcoverBookshelf({
  searchResults = [],
  onRequestBook,
  users,
}: BookShelfProps) {
  const [selectedBook, setSelectedBook] = useState<NewBookRequest | null>(null);
  const [bookDescription, setBookDescription] = useState<string | null>(null);

  const handleRequestClick = (book: HardcoverBook) => {
    setSelectedBook({
      title: book.title,
      author: book.contributions?.[0].author.name || "",
      source: "HARDCOVER",
      source_id: book.id.toString(),
      isbn_10: book.default_physical_edition?.isbn_10 || null,
      isbn_13: book.default_physical_edition?.isbn_13 || null,
      cover: book.images?.[0].url || null,
      requestor_id: "",
      requestor_username: "",
    });
    setBookDescription(book.description || null);
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
    setBookDescription(null);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <ScrollArea className="h-full">
        <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {searchResults.map((book) => (
            <Card
              key={book.id}
              className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="flex flex-col items-center p-4 h-full">
                <div className="w-32 h-48 mb-4 relative">
                  {book.images.length > 0 ? (
                    <img
                      src={book.images[0].url}
                      alt={`Cover of ${book.title}`}
                      className="absolute inset-0 w-full h-full object-contain shadow-md rounded-md"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-sm text-center px-2">
                        No Cover Available
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-center line-clamp-2 mb-2">
                  {book.title}
                </h3>
                {book.contributions.length > 0 && (
                  <p className="text-xs text-gray-400 text-center mb-4 line-clamp-1">
                    {book.contributions[0].author.name}
                  </p>
                )}
                <div className="mt-auto w-full space-y-2">
                  {book.slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a
                        href={`https://hardcover.app/books/${book.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Info className="w-4 h-4 mr-2" aria-hidden="true" />
                        <span>More Info</span>
                        <span className="sr-only">about {book.title}</span>
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRequestClick(book)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span>Request</span>
                    <span className="sr-only">to borrow {book.title}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <RequestPrompt
        selectedBook={selectedBook}
        bookDescription={bookDescription}
        handleCloseModal={handleCloseModal}
        onRequestBook={onRequestBook}
        users={users}
      />
    </main>
  );
}
