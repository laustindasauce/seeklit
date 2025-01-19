// OpenLibraryCoverImages type with three URL options for different sizes
type OpenLibraryCoverImages = {
    small: string;
    medium: string;
    large: string;
}

// OpenLibraryBook type matching the structure of the Pydantic model
type OpenLibraryBook = {
    title: string;
    author_name: string[];
    info_link: string | null;
    cover_images: OpenLibraryCoverImages | null;
}

// OpenLibraryResponse type representing the entire response structure
type OpenLibraryResponse = {
    docs: OpenLibraryBook[];
    numFound: number;
    start: number;
    num_found_exact: boolean;
}