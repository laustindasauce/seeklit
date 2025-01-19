package cwa

// CWABook represents a book returned by the CWA API.
type CWABook struct {
	Author       string   `json:"author"`
	DownloadURLs []string `json:"download_urls"`
	Format       string   `json:"format"`
	ID           string   `json:"id"`
	Language     string   `json:"language"`
	Preview      string   `json:"preview"`
	Publisher    string   `json:"publisher"`
	Size         string   `json:"size"`
	Title        string   `json:"title"`
	Year         string   `json:"year"`
}
