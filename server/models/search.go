package models

import "fmt"

type Search struct {
	Query string `json:"query"`
}

type GoogleBooksResponse struct {
	Items []any `json:"items"`
}

type OpenLibraryBook struct {
	Title       string              `json:"title"`
	AuthorName  []string            `json:"author_name"`
	CoverImages []OpenLibCoverImage `json:"cover_images"`
	CoverID     *int                `json:"cover_i"`
	Seed        []string            `json:"seed"`
	InfoLink    *string             `json:"info_link"`
}

type OpenLibCoverImage struct {
	Small  string `json:"small"`
	Medium string `json:"medium"`
	Large  string `json:"large"`
}

func (o *OpenLibraryBook) SetCoverImage() {
	if o.CoverID != nil {
		o.CoverImages = []OpenLibCoverImage{
			{
				Small:  fmt.Sprintf("https://covers.openlibrary.org/b/id/%d-S.jpg", *o.CoverID),
				Medium: fmt.Sprintf("https://covers.openlibrary.org/b/id/%d-M.jpg", *o.CoverID),
				Large:  fmt.Sprintf("https://covers.openlibrary.org/b/id/%d-L.jpg", *o.CoverID),
			},
		}
	}
}

func (o *OpenLibraryBook) SetInfoLink() {
	if len(o.Seed) > 0 {
		link := "https://openlibrary.org" + o.Seed[0]
		o.InfoLink = &link
	}
}

type OpenLibraryResponse struct {
	Docs          []OpenLibraryBook `json:"docs"`
	NumFound      int               `json:"numFound"`
	Start         int               `json:"start"`
	NumFoundExact bool              `json:"num_found_exact"`
}

type HardcoverResponse struct {
	Data struct {
		Books []HardcoverBook `json:"books"`
	} `json:"data"`
	Errors any `json:"errors"`
}

type HardcoverBook struct {
	ID             int              `json:"id"`
	Title          string           `json:"title"`
	UsersReadCount int              `json:"users_read_count"`
	UsersCount     int              `json:"users_count"`
	Slug           string           `json:"slug"`
	Images         []HardcoverImage `json:"images"`
	CachedImage    *struct {
		URL string `json:"url"`
	} `json:"cached_image"`
	Description            *string                 `json:"description"`
	Contributions          []HardcoverContribution `json:"contributions"`
	DefaultPhysicalEdition *HardcoverIdentifiers   `json:"default_physical_edition"`
}

type HardcoverImage struct {
	URL string `json:"url"`
}

type HardcoverContribution struct {
	Author HardcoverAuthor `json:"author"`
}

type HardcoverAuthor struct {
	Name string `json:"name"`
	ID   int    `json:"id"`
}

type HardcoverIdentifiers struct {
	ISBN10 *string `json:"isbn_10"`
	ISBN13 *string `json:"isbn_13"`
}
