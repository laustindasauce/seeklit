/* eslint-disable import/no-unresolved */
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, BookOpen, BadgeAlert, BookHeadphones } from "lucide-react";
import RequestPrompt from "./RequestPrompt";
import IssuePrompt from "./IssuePrompt";
import { getEnvVal } from "@/lib/utils";

// A standardized interface for book data from any source.
export interface UniversalBook {
  id: string; // A unique key for React (e.g., combination of source and source_id)
  title: string;
  author: string | null;
  coverUrl: string | null;
  infoLink: string | null;
  source: "ABS" | "GOOGLE" | "OPENLIBRARY" | "HARDCOVER";
  source_id: string; // The ID from the original source
  isbn_10?: string | null;
  isbn_13?: string | null;
  description?: string | null;
  isAudiobook?: boolean;
}

// Props for the UniversalBookShelf component
interface UniversalBookShelfProps {
  dataSource: UniversalBook[];
  title: string;
  shelfType: "ABS" | "EXTERNAL";
  onRequestBook?: (req: NewBookRequest) => Promise<void>;
  onSubmitIssue?: (issue: NewIssue) => Promise<void>;
  users?: User[];
  absBaseUrl?: string;
}

export default function UniversalBookShelf({
  dataSource = [],
  title,
  shelfType,
  onRequestBook,
  onSubmitIssue,
  users = [],
  absBaseUrl,
}: UniversalBookShelfProps) {
  const [selectedBook, setSelectedBook] = useState<NewBookRequest | null>(null);
  const [bookDescription, setBookDescription] = useState<string | null>(null);
  const [newIssue, setNewIssue] = useState<NewIssue | null>(null);
  const isIssuesDisabled =
    getEnvVal(import.meta.env.VITE_DISABLE_ISSUES, "false") === "true";

  const handleRequestClick = (book: UniversalBook) => {
    setSelectedBook({
      title: book.title,
      author: book.author || "",
      source: book.source,
      source_id: book.source_id,
      isbn_10: book.isbn_10 || null,
      isbn_13: book.isbn_13 || null,
      cover: book.coverUrl || null,
      requestor_id: "",
      requestor_username: "",
    });
    setBookDescription(book.description || null);
  };

  const handleNewIssueClick = (book: UniversalBook) => {
    setNewIssue({
      book_id: book.source_id,
      book_title: book.title,
      description: "",
      severity: "low",
      creator_id: "",
      creator_username: "",
    });
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
    setBookDescription(null);
    setNewIssue(null);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <ScrollArea className="h-full">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        {dataSource.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {dataSource.map((book) => (
              <Card
                key={book.id}
                className={`flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  shelfType === "ABS" && book.isAudiobook
                    ? "border-blue-300"
                    : ""
                } ${
                  shelfType === "ABS" && !book.isAudiobook
                    ? "border-green-300"
                    : ""
                }`}
              >
                <CardContent className="flex flex-col items-center p-4 h-full">
                  <div className="w-32 h-48 mb-4 relative">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
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
                  {book.author && (
                    <p className="text-xs text-gray-400 text-center mb-4 line-clamp-1">
                      {book.author}
                    </p>
                  )}
                  <div className="mt-auto w-full space-y-2">
                    {/* ABS Shelf Buttons */}
                    {shelfType === "ABS" && (
                      <>
                        {!isIssuesDisabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-black"
                            onClick={() => handleNewIssueClick(book)}
                          >
                            <BadgeAlert
                              className="w-4 h-4 mr-2"
                              aria-hidden="true"
                            />
                            <span>Report Issue</span>
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            window.open(book.infoLink!, "_blank")?.focus()
                          }
                        >
                          {book.isAudiobook ? (
                            <BookHeadphones
                              className="w-4 h-4 mr-2"
                              aria-hidden="true"
                            />
                          ) : (
                            <BookOpen
                              className="w-4 h-4 mr-2"
                              aria-hidden="true"
                            />
                          )}
                          <span>{book.isAudiobook ? "Listen" : "Read"}</span>
                        </Button>
                      </>
                    )}
                    {/* External Shelf Buttons */}
                    {shelfType === "EXTERNAL" && (
                      <>
                        {book.infoLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <a
                              href={book.infoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Info
                                className="w-4 h-4 mr-2"
                                aria-hidden="true"
                              />
                              <span>More Info</span>
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => handleRequestClick(book)}
                        >
                          <BookOpen
                            className="w-4 h-4 mr-2"
                            aria-hidden="true"
                          />
                          <span>Request</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xl font-semibold text-gray-500">
              Oops, just empty shelves here.
            </p>
            <p className="text-gray-400">Seek for a new book!</p>
          </div>
        )}
      </ScrollArea>
      <hr className="my-8 border-t border-gray-200" aria-hidden="true" />

      {shelfType === "EXTERNAL" && (
        <RequestPrompt
          selectedBook={selectedBook}
          bookDescription={bookDescription}
          handleCloseModal={handleCloseModal}
          onRequestBook={onRequestBook}
          users={users}
        />
      )}

      {shelfType === "ABS" && !!newIssue && absBaseUrl && !isIssuesDisabled && (
        <IssuePrompt
          newIssue={newIssue}
          handleCloseModal={handleCloseModal}
          onSubmitIssue={onSubmitIssue}
          absBaseUrl={absBaseUrl}
        />
      )}
    </main>
  );
}
