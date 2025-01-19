/* eslint-disable import/no-unresolved */

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { redirect } from "@remix-run/react";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { getUserToken } from "@/session.server";
import { useDebounce, useOptionalUser } from "@/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { localApi } from "@/lib/localApi";
import HardcoverBookshelf from "@/components/HardcoverBookshelf";
import GoogleBookShelf from "@/components/GoogleBookshelf";
import OpenLibraryBookshelf from "@/components/OpenLibraryBookshelf";
import ReadarrBookShelf from "@/components/ReadarrBookshelf";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import AbsBookShelf from "@/components/AbsBookshelf";

// Define the loader for user authentication.
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (!userToken) return redirect("/auth");
  return Response.json({ userToken });
};

export default function IndexHandler() {
  const user = useOptionalUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [absSearchResults, setAbsSearchResults] = useState<BookItem[]>([]);
  const [googleSearchResults, setGoogleSearchResults] = useState<GoogleBook[]>(
    []
  );
  const [openLibrarySearchResults, setOpenLibrarySearchResults] = useState<
    OpenLibraryBook[]
  >([]);
  const [hardcoverSearchResults, setHardcoverSearchResults] = useState<
    HardcoverBook[]
  >([]);
  const [readarrSearchResults, setReadarrSearchResults] = useState<
    ReadarrBook[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [serverSettings, setServerSettings] = useState<LocalServerSettings>();

  // Debounced value will only update after a delay of 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [hasResults, setHasResults] = useState(false);

  const handleSearch = async (
    token: string,
    provider: string,
    query: string
  ) => {
    setIsSearching(true);

    switch (provider) {
      case "GOOGLE":
        try {
          const data = await localApi.googleSearch(token, query);
          const searchData = data.search_results as GoogleBook[];
          setHasResults(searchData.length > 0);
          setGoogleSearchResults(searchData || []);
          setAbsSearchResults(data.abs_results);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
        return setIsSearching(false);
      case "OPENLIBRARY":
        try {
          const data = await localApi.openlibSearch(token, query);
          const searchRes = data.search_results as OpenLibraryResponse;
          setHasResults(searchRes.docs.length > 0);
          setOpenLibrarySearchResults(searchRes.docs || []);
          setAbsSearchResults(data.abs_results);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
        return setIsSearching(false);
      case "HARDCOVER":
        try {
          const data = await localApi.hardcoverSearch(token, query);
          const searchData = data.search_results as HardcoverBook[];
          setHasResults(searchData.length > 0);
          setHardcoverSearchResults(searchData || []);
          setAbsSearchResults(data.abs_results);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
        return setIsSearching(false);
      case "READARR":
        try {
          const data = await localApi.readarrSearch(token, query);
          const searchData = data.search_results as ReadarrBook[];
          setHasResults(searchData.length > 0);
          setReadarrSearchResults(searchData || []);
          setAbsSearchResults(data.abs_results);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
        return setIsSearching(false);
      default:
        setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!debouncedSearchQuery || !serverSettings || !user) return;
    handleSearch(
      user.token,
      serverSettings.metadata_provider,
      debouncedSearchQuery
    );
  }, [debouncedSearchQuery, serverSettings, user]);

  useEffect(() => {
    if (searchQuery === "") {
      setIsSearching(false);
      setAbsSearchResults([]);
      setGoogleSearchResults([]);
      setOpenLibrarySearchResults([]);
      setHardcoverSearchResults([]);
      setReadarrSearchResults([]);
      setHasResults(false);
    }
  }, [searchQuery]);

  // Get the server settings on load
  useEffect(() => {
    localApi
      .getServerSettings()
      .then((res) => setServerSettings(res))
      .catch((err) => console.error(err));
  }, []);

  const handleKeydown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && searchQuery) {
      if (!user || !serverSettings) return;
      handleSearch(
        user.token,
        serverSettings.metadata_provider,
        debouncedSearchQuery
      );
    }
  };

  const handleRequest = async (req: NewBookRequest) => {
    if (!user) return;
    if (!req.title || !req.author) {
      toast({
        title: "Invalid Book",
        description:
          "This book isn't valid for request due to missing metadata. Please find a different edition.",
      });
      return;
    }
    try {
      req.requestor_id = user.id;
      req.requestor_username = user.username;

      await localApi.createNewRequest(user.token, req);

      toast({
        title: "New Book Request",
        description: "Your book request was created.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong submitting your book request.",
      });
    }
  };

  const handleNewIssue = async (issue: NewIssue) => {
    if (!user) return;
    try {
      issue.creator_id = user.id;
      issue.creator_username = user.username;

      await localApi.createNewIssue(user.token, issue);

      toast({
        title: "New Issue",
        description: "Thank you!! The issue has been reported.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong reporting the issue.",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar user={user} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col">
        <header className="shadow-sm">
          <Toaster />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-4 lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex-1 flex items-center">
              <div className="flex-1 relative">
                <Input
                  type="search"
                  placeholder="Seek..."
                  // className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeydown}
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-10 flex items-center pointer-events-none">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center">
                <Avatar>
                  {/* <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username} /> */}
                  <AvatarFallback>
                    {user?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* <span className="ml-2 text-sm font-medium">{user?.username}</span> */}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {absSearchResults.length > 0 && (
            <AbsBookShelf
              searchResults={absSearchResults}
              onSubmitIssue={handleNewIssue}
            />
          )}
          {serverSettings?.metadata_provider === "GOOGLE" &&
            googleSearchResults.length > 0 && (
              <GoogleBookShelf
                searchResults={googleSearchResults}
                onRequestBook={handleRequest}
              />
            )}
          {serverSettings?.metadata_provider === "OPENLIBRARY" &&
            openLibrarySearchResults.length > 0 && (
              <OpenLibraryBookshelf
                searchResults={openLibrarySearchResults}
                onRequestBook={handleRequest}
              />
            )}
          {serverSettings?.metadata_provider === "HARDCOVER" &&
            hardcoverSearchResults.length > 0 && (
              <HardcoverBookshelf
                searchResults={hardcoverSearchResults}
                onRequestBook={handleRequest}
              />
            )}
          {serverSettings?.metadata_provider === "READARR" &&
            readarrSearchResults.length > 0 && (
              <ReadarrBookShelf
                searchResults={readarrSearchResults}
                onRequestBook={handleRequest}
              />
            )}
          {!hasResults &&
            absSearchResults.length === 0 &&
            !debouncedSearchQuery && (
              <div className="flex flex-col items-center justify-center text-center">
                {/* <p className="text-xl font-semibold text-gray-500">
                Oops, just empty shelves here.
              </p> */}
                <p className="text-gray-400">Seek for a new book!</p>
              </div>
            )}
          {!hasResults &&
            absSearchResults.length === 0 &&
            !!debouncedSearchQuery && (
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-xl font-semibold text-gray-500">
                  Oops, just empty shelves here.
                </p>
                <p className="text-gray-400">
                  Try to broaden your query if you are having trouble fetching
                  any results.
                </p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
