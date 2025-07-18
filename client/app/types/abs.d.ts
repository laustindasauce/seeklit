// Type for a media progress entry
type MediaProgress = {
  id: string;
  libraryItemId: string;
  episodeId: string;
  duration: number;
  progress: number;
  currentTime: number;
  isFinished: boolean;
  hideFromContinueListening: boolean;
  lastUpdate: number;
  startedAt: number;
  finishedAt: number | null;
};

// Type for user permissions
type UserPermissions = {
  download: boolean;
  update: boolean;
  delete: boolean;
  upload: boolean;
  accessAllLibraries: boolean;
  accessAllTags: boolean;
  accessExplicitContent: boolean;
};

// Type for user information
type User = {
  id: string;
  username: string;
  type: string;
  token: string; // Deprecated - use accessToken instead
  accessToken: string; // New JWT token
  refreshToken?: string; // Optional - only returned with x-return-tokens header
  mediaProgress: MediaProgress[];
  seriesHideFromContinueListening: string[];
  bookmarks: string[];
  isActive: boolean;
  isLocked: boolean;
  lastSeen: number;
  createdAt: number;
  permissions: UserPermissions;
  librariesAccessible: string[];
  itemTagsAccessible: string[];
};

// Type for server settings
type ServerSettings = {
  id: string;
  scannerFindCovers: boolean;
  scannerCoverProvider: string;
  scannerParseSubtitle: boolean;
  scannerPreferMatchedMetadata: boolean;
  scannerDisableWatcher: boolean;
  storeCoverWithItem: boolean;
  storeMetadataWithItem: boolean;
  metadataFileFormat: string;
  rateLimitLoginRequests: number;
  rateLimitLoginWindow: number;
  backupSchedule: string;
  backupsToKeep: number;
  maxBackupSize: number;
  loggerDailyLogsToKeep: number;
  loggerScannerLogsToKeep: number;
  homeBookshelfView: number;
  bookshelfView: number;
  sortingIgnorePrefix: boolean;
  sortingPrefixes: string[];
  chromecastEnabled: boolean;
  dateFormat: string;
  language: string;
  logLevel: number;
  version: string;
};

// Type for the overall API response
type LoginResponse = {
  user: User;
  userDefaultLibraryId: string;
  serverSettings: ServerSettings;
  Source: string;
};

type LibraryResponse = {
  libraries: Library[];
};

type Library = {
  id: string;
  name: string;
  folders: Folder[];
  displayOrder: number;
  icon: string;
  mediaType: "book" | "podcast";
  provider: string;
  settings: LibrarySettings;
  createdAt: number;
  lastUpdate: number;
};

type Folder = {
  id: string;
  fullPath: string;
  libraryId: string;
  addedAt?: number;
};

type LibrarySettings = {
  coverAspectRatio: number;
  disableWatcher: boolean;
  skipMatchingMediaWithAsin: boolean;
  skipMatchingMediaWithIsbn: boolean;
  autoScanCronExpression: string | null;
};

type BookResponse = {
  book: BookItem[];
};

type BookItem = {
  libraryItem: LibraryItem;
  matchKey: string;
  matchText: string;
};

type LibraryItem = {
  id: string;
  ino: string;
  libraryId: string;
  folderId: string;
  path: string;
  relPath: string;
  isFile: boolean;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  addedAt: number;
  updatedAt: number;
  lastScan: number;
  scanVersion: string;
  isMissing: boolean;
  isInvalid: boolean;
  mediaType: "book";
  media: Media;
  coverPath: string;
  tags: string[];
};

type Media = {
  libraryItemId: string;
  metadata: Metadata;
  coverPath: string;
  tags: string[];
  audioFiles: AudioFile[];
  chapters: Chapter[];
  duration: number;
  size: number;
  tracks: Track[];
  ebookFile: null | string;
  numTracks: number;
  numAudioFiles: number;
};

type Metadata = {
  title: string;
  titleIgnorePrefix: string;
  subtitle: string | null;
  authors: Author[];
  narrators: string[];
  series: Series[];
  genres: string[];
  publishedYear: string;
  publishedDate: string | null;
  publisher: string;
  description: string;
  isbn: string | null;
  asin: string | null;
  language: string | null;
  explicit: boolean;
  authorName: string;
  authorNameLF: string;
  narratorName: string;
  seriesName: string;
};

type Author = {
  id: string;
  asin: string | null;
  name: string;
  description: string | null;
  imagePath: string | null;
  addedAt: number;
  updatedAt: number;
  numBooks: number;
};

type UsersResponse = {
  users: User[];
};
