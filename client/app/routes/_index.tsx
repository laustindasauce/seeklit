/* eslint-disable import/no-unresolved */

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { redirect, useLoaderData } from "@remix-run/react";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { getUserToken } from "@/session.server";
import {
  transformAbsBook,
  transformGoogleBook,
  transformHardcoverBook,
  transformOpenLibraryBook,
  useDebounce,
  useOptionalUser,
} from "@/utils";
import UserAvatar from "@/components/UserAvatar";
import { localApi } from "@/lib/localApi";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { getEnvVal } from "@/lib/utils";
import UniversalBookShelf, {
  UniversalBook,
} from "@/components/UniversalBookShelf";

// Define the data type for the loader
type LoaderData = {
  userToken: string;
  absBaseUrl: string;
};

// Define the loader for user authentication.
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (!userToken) return redirect("/auth");

  const clientOrigin = request.headers.get("referer") || "";
  let origin = "";

  // Try to get origin from referer, but fall back to request URL if not available
  if (clientOrigin) {
    try {
      const url = new URL(clientOrigin);
      origin = url.origin;
    } catch (error) {
      console.error("Invalid URL in referer:", clientOrigin);
      // Fall back to request URL origin instead of logging out
      const requestUrl = new URL(request.url);
      origin = requestUrl.origin;
    }
  } else {
    // No referer header, use request URL origin
    const requestUrl = new URL(request.url);
    origin = requestUrl.origin;
  }

  const absBaseUrl = getEnvVal(process.env.SEEKLIT_ABS_EXTERNAL_URL, origin);

  return Response.json({
    userToken,
    absBaseUrl,
  });
};

export default function IndexHandler() {
  const user = useOptionalUser();
  const { absBaseUrl } = useLoaderData<LoaderData>();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [serverSettings, setServerSettings] = useState<LocalServerSettings>();
  const [recentBooks, setRecentBooks] = useState<BookItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const [absSearchResults, setAbsSearchResults] = useState<UniversalBook[]>([]);
  const [externalSearchResults, setExternalSearchResults] = useState<
    UniversalBook[]
  >([]);

  const absRecentBooks: UniversalBook[] = recentBooks.map((book) =>
    transformAbsBook(book, absBaseUrl)
  );

  // Debounced value will only update after a delay of 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const hasResults =
    externalSearchResults.length > 0 || absSearchResults.length > 0;

  const handleSearch = async (
    token: string,
    provider: string,
    query: string
  ) => {
    setIsSearching(true);
    let externalData: UniversalBook[] = [];
    let absData: UniversalBook[] = [];

    try {
      switch (provider) {
        case "GOOGLE": {
          const data = await localApi.googleSearch(token, query);
          externalData = (data.search_results as GoogleBook[]).map(
            transformGoogleBook
          );
          absData = (data.abs_results as BookItem[]).map((book) =>
            transformAbsBook(book, absBaseUrl)
          );
          break;
        }
        case "OPENLIBRARY": {
          const data = await localApi.openlibSearch(token, query);
          const searchRes = data.search_results as OpenLibraryResponse;
          externalData = (searchRes.docs || []).map(transformOpenLibraryBook);
          absData = (data.abs_results as BookItem[]).map((book) =>
            transformAbsBook(book, absBaseUrl)
          );
          break;
        }
        case "HARDCOVER": {
          const data = await localApi.hardcoverSearch(token, query);
          externalData = (data.search_results as HardcoverBook[]).map(
            transformHardcoverBook
          );
          absData = (data.abs_results as BookItem[]).map((book) =>
            transformAbsBook(book, absBaseUrl)
          );
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Search Error",
        description: "Failed to fetch search results.",
        variant: "destructive",
      });
    } finally {
      setExternalSearchResults(externalData);
      setAbsSearchResults(absData);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!debouncedSearchQuery || !serverSettings || !user) return;
    handleSearch(
      user.accessToken,
      serverSettings.metadata_provider,
      debouncedSearchQuery
    );
  }, [debouncedSearchQuery, serverSettings, user]);

  useEffect(() => {
    if (searchQuery === "") {
      setIsSearching(false);
      setAbsSearchResults([]);
      setExternalSearchResults([]);
    }
  }, [searchQuery]);

  // Get the server settings on load
  useEffect(() => {
    localApi
      .getServerSettings()
      .then((res) => setServerSettings(res))
      .catch((err) => console.error(err));
  }, []);

  // Get recent books on load
  useEffect(() => {
    if (!user) return;

    setIsLoadingRecent(true);
    localApi
      .getRecentBooks(window.location.origin, user.accessToken)
      .then((res) => {
        setRecentBooks(res.abs_results);
      })
      .catch((err) => {
        console.error("Error fetching recent books:", err);
        setRecentBooks([]);
      })
      .finally(() => {
        setIsLoadingRecent(false);
      });
  }, [user]);

  // Get users on load (only for admin/root users)
  useEffect(() => {
    if (!user || (user.type !== "admin" && user.type !== "root")) {
      setUsers([]);
      return;
    }

    localApi
      .getUsers(user.accessToken)
      .then((res) => {
        setUsers(res.users);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setUsers([]);
      });
  }, [user]);

  const handleKeydown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && searchQuery) {
      if (!user || !serverSettings) return;
      handleSearch(
        user.accessToken,
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
        variant: "destructive",
      });
      return;
    }
    try {
      await localApi.createNewRequest(user.accessToken, req);

      toast({
        title: "New Book Request",
        description: "Your book request was created.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong submitting your book request.",
        variant: "destructive",
      });
    }
  };

  const handleNewIssue = async (issue: NewIssue) => {
    if (!user) return;
    try {
      issue.creator_id = user.id;
      issue.creator_username = user.username;

      await localApi.createNewIssue(user.accessToken, issue);

      toast({
        title: "New Issue",
        description: "Thank you!! The issue has been reported.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong reporting the issue.",
        variant: "destructive",
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeydown}
                  className="input-styled"
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center">
                <UserAvatar user={user} />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {absSearchResults.length > 0 && (
            <UniversalBookShelf
              shelfType="ABS"
              title="In Library"
              dataSource={absSearchResults}
              onSubmitIssue={handleNewIssue}
              absBaseUrl={absBaseUrl}
            />
          )}

          {externalSearchResults.length > 0 && (
            <UniversalBookShelf
              shelfType="EXTERNAL"
              title="Search Results"
              dataSource={externalSearchResults}
              onRequestBook={handleRequest}
              users={users}
            />
          )}

          {!hasResults && !debouncedSearchQuery && (
            <>
              {isLoadingRecent ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                  <p className="text-gray-400">Loading recent books...</p>
                </div>
              ) : absRecentBooks.length > 0 ? (
                <UniversalBookShelf
                  shelfType="ABS"
                  title="Recently Added"
                  dataSource={absRecentBooks}
                  onSubmitIssue={handleNewIssue}
                  absBaseUrl={absBaseUrl}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-gray-400">Seek for a new book!</p>
                </div>
              )}
            </>
          )}
          {!hasResults && !!debouncedSearchQuery && !isSearching && (
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-xl font-semibold text-gray-500">
                Oops, just empty shelves here.
              </p>
              <p className="text-gray-400">
                Try to broaden your query if you are having trouble fetching any
                results.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
