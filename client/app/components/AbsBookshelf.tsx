/* eslint-disable import/no-unresolved */
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeAlert, BookHeadphones, BookOpen } from "lucide-react";
import { getEnvVal } from "@/lib/utils";
import IssuePrompt from "./IssuePrompt";
import React from "react";

interface BookShelfProps {
  searchResults?: BookItem[];
  onSubmitIssue?: (issue: NewIssue) => Promise<void>;
  title?: string;
}

export default function AbsBookShelf({
  searchResults = [],
  onSubmitIssue,
  title,
}: BookShelfProps) {
  const [newIssue, setNewIssue] = React.useState<NewIssue | null>();
  const clientOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const absBaseUrl = getEnvVal(import.meta.env.VITE_ABS_URL, clientOrigin);

  const handleNewIssue = (book: BookItem) => {
    const issue: NewIssue = {
      book_id: book.libraryItem.id,
      book_title: book.libraryItem.media.metadata.title,
      description: "",
      severity: "low",
      creator_id: "",
      creator_username: "",
    };
    setNewIssue(issue);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <ScrollArea className="h-full">
        <h2 className="text-2xl font-semibold mb-4">{title || "In Library"}</h2>
        {searchResults && searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {searchResults.map((book) => {
              const isAudiobook = book.libraryItem.media.numAudioFiles > 0;
              return (
                <Card
                  key={book.libraryItem.id}
                  className={`flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    isAudiobook ? "border-blue-300" : "border-green-300"
                  }`}
                >
                  <CardContent className="flex flex-col items-center p-4 h-full">
                    <div className="w-32 h-48 mb-4 relative">
                      <img
                        src={
                          absBaseUrl + `/api/items/${book.libraryItem.id}/cover`
                        }
                        alt={`Cover of ${book.libraryItem.media.metadata.title}`}
                        className="absolute inset-0 w-full h-full object-contain shadow-md rounded-md"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-center line-clamp-2 mb-2">
                      {book.libraryItem.media.metadata.title}
                    </h3>
                    <p className="text-xs text-gray-400 text-center mb-4 line-clamp-1">
                      {book.libraryItem.media.metadata.authorName}
                    </p>
                    <div className="mt-auto w-full space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-black"
                        onClick={() => handleNewIssue(book)}
                      >
                        <BadgeAlert
                          className="w-4 h-4 mr-2"
                          aria-hidden="true"
                        />
                        <span>Report Issue</span>
                        <span className="sr-only">
                          on {book.libraryItem.media.metadata.title}
                        </span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          window
                            .open(
                              absBaseUrl + `/item/${book.libraryItem.id}`,
                              "_blank"
                            )
                            ?.focus()
                        }
                      >
                        {isAudiobook ? (
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
                        <span>{isAudiobook ? "Listen" : "Read"}</span>
                        <span className="sr-only">
                          to {isAudiobook ? "listen to" : "read"}{" "}
                          {book.libraryItem.media.metadata.title}
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

      {!!newIssue && (
        <IssuePrompt
          newIssue={newIssue}
          handleCloseModal={() => setNewIssue(null)}
          onSubmitIssue={onSubmitIssue}
          absBaseUrl={absBaseUrl}
        />
      )}
    </main>
  );
}
