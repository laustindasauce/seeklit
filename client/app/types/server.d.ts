//
type LocalServerSettings = {
  metadata_provider: "GOOGLE" | "OPENLIBRARY" | "HARDCOVER" | "READARR";
  indexer_enabled: boolean;
  zlibrary_enabled: boolean;
  cwa_enabled: boolean;
  version: string;
};

type BookRequest = {
  id: number;
  title: string;
  author: string;
  source: string;
  source_id: string;
  isbn_10: string | null;
  isbn_13: string | null;
  cover: string | null;
  approval_status: string;
  download_status: string;
  download_source: string | null;
  requestor_id: string;
  requestor_username: string;
  created_at: string;
  updated_at: string;
};

type NewBookRequest = {
  title: string;
  author: string;
  source: string;
  source_id: string;
  isbn_10: string | null;
  isbn_13: string | null;
  cover: string | null;
  requestor_id: string;
  requestor_username: string;
};

type EditBookRequest = {
  approval_status: string;
  download_status: string;
  download_source: string | null;
};

type LocalSearchResponse = {
  search_results:
    | GoogleBook[]
    | OpenLibraryResponse
    | HardcoverBook[]
    | ReadarrBook[];
  abs_results: BookItem[];
};

type Issue = {
  id: number;
  book_id: string;
  book_title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "cancelled" | "resolved";
  creator_id: string;
  creator_username: string;
  created_at: string;
  updated_at: string;
};

type NewIssue = {
  book_id: string;
  book_title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  creator_id: string;
  creator_username: string;
};

type EditIssue = {
  status: string;
};

type ServerConfig = {
  [section: string]: Record<string, string>;
};

type ServerConfigUpdate = {
  key: string;
  value: string;
};
