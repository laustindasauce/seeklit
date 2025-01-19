
type ReadarrRatings = {
  votes: number
  value: number
  popularity: number
}

type ReadarrLink = {
  url: string;
  name: string;
}

type ReadarrImage = {
  url: string;
  coverType: string;
  extension: string;
};

type ReadarrStatistics = {
  bookFileCount: number;
  bookCount: number;
  availableBookCount: number;
  totalBookCount: number;
  sizeOnDisk: number;
  percentOfBooks: number;
};

type ReadarrAddOptionsAuthor = {
  monitor: string;
  searchForMissingBooks: boolean;
};

type ReadarrAddOptionsBook = {
  searchForNewBook: boolean;
};

type ReadarrAuthor = {
  authorMetadataId: number;
  status: string;
  ended: boolean;
  authorName: string;
  authorNameLastFirst: string;
  foreignAuthorId: string;
  titleSlug: string;
  overview: string;
  links: ReadarrLink[];
  images: ReadarrImage[];
  qualityProfileId: number;
  metadataProfileId: number;
  monitored: boolean;
  monitorNewItems: string;
  genres: string[];
  cleanName: string;
  sortName: string;
  sortNameLastFirst: string;
  tags: (string | number)[];
  added: Date;
  ratings: ReadarrRatings;
  statistics: ReadarrStatistics;
  addOptions: ReadarrAddOptionsAuthor;
  rootFolderPath: string;
};

type ReadarrBook = {
  id: number
  title: string
  authorTitle: string
  seriesTitle: string
  disambiguation: string
  overview: string
  authorId: number
  foreignBookId: string
  foreignEditionId: string
  titleSlug: string
  monitored: boolean
  anyEditionOk: boolean
  ratings: ReadarrRatings
  releaseDate: Date
  pageCount: number
  genres: string[]
  author: ReadarrAuthor
  images: ReadarrImage[]
  links: ReadarrLink[];
  added: Date;
  remoteCover: string;
  // editions: Edition[];
  grabbed: boolean;
  statistics: ReadarrStatistics;
  addOptions: ReadarrAddOptionsBook;
}
