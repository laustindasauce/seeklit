type HardcoverAuthor = {
  name: string;
  id: number;
}

type HardcoverContribution = {
  author: HardcoverAuthor;
}

type HardcoverImage = {
  url: string;
}

type HardcoverIdentifiers = {
  isbn_10: string | null;
  isbn_13: string | null;
}

type HardcoverBook = {
  title: string;
  id: number;
  slug: string;
  users_count: number;
  description: string | null;
  contributions: HardcoverContribution[];
  images: HardcoverImage[];
  default_physical_edition: HardcoverIdentifiers | null
}
