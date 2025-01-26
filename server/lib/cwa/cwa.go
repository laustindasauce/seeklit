package cwa

import (
	"api/models"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

// query the CWA API for books matching the given query.
func search(cwaURL, query string) ([]CWABook, error) {
	logs.Info("Searching for books with CWA; query=%s...", query)

	url := fmt.Sprintf("%s/request/api/search", cwaURL)
	resp, err := http.Get(fmt.Sprintf("%s?query=%s", url, query))
	if err != nil {
		logs.Info("Error making search request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logs.Info("CWA search response status: %d", resp.StatusCode)
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var books []CWABook
	if err := json.NewDecoder(resp.Body).Decode(&books); err != nil {
		logs.Info("Error decoding search response: %v", err)
		return nil, err
	}

	logs.Info("Search results: %v", books)
	return books, nil
}

// fetche a book by its ID from the CWA API.
func download(cwaURL, bookID string) error {
	logs.Info("Downloading book with CWA; id=%s...", bookID)

	url := fmt.Sprintf("%s/request/api/download?id=%s", cwaURL, bookID)
	resp, err := http.Get(url)
	if err != nil {
		logs.Info("Error making download request: %v", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logs.Info("CWA download response status: %d", resp.StatusCode)
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// HandleSearchAndDownload handles searching and downloading books based on the request.
func HandleSearchAndDownload(request models.BookRequest) (*CWABook, error) {
	var books []CWABook
	var err error

	cwaURL, err := config.String("download::cwaurl")
	if err != nil {
		logs.Critical("Missing download::cwaurl config setting. Unable to perform CWA search.")
		return nil, errors.New("Missing download::cwaurl config setting.")
	}

	// Prefer ISBN-13 for searching
	if request.ISBN13 != nil {
		logs.Debug("Performing CWA search with ISBN-13")
		books, err = search(cwaURL, *request.ISBN13)
	} else if request.ISBN10 != nil {
		logs.Debug("Performing CWA search with ISBN-10")
		books, err = search(cwaURL, *request.ISBN10)
	} else {
		logs.Debug("Performing CWA search with title")
		books, err = search(cwaURL, request.Title)
	}

	if err != nil {
		logs.Warn("Hit an error while attempting download: \n%v\n", err)
		return nil, err
	}

	if len(books) == 0 {
		logs.Info("No results found when searching with CWA")
		return nil, errors.New("No results found when searching with CWA")
	}

	maxMB := config.DefaultFloat("download::ebookmaxbytes", 25<<20) / (1024 * 1024)
	minMB := config.DefaultFloat("download::ebookminbytes", 104858) / (1024 * 1024)

	// Parse books and download books that pass requirements
	for _, book := range books {
		size, err := extractSizeInMB(book.Size)
		if err != nil || size > maxMB || size < minMB {
			logs.Info("Invalid size for book: %v", err)
			continue
		}
		if !strings.Contains(strings.ToLower(book.Title), strings.ToLower(request.Title)) {
			logs.Info("Invalid title: %s", book.Title)
			continue
		}

		if containsBlockedTerms(strings.ToLower(book.Title)) {
			logs.Info("Title contains one or more pre-configured blocked terms: %s", book.Title)
			continue
		}

		if err := download(cwaURL, book.ID); err != nil {
			logs.Info("Error downloading book: %v", err)
			continue
		}

		return &book, nil
	}

	return nil, nil
}

// extractSizeInMB parses the size string and extracts the numeric part in MB.
func extractSizeInMB(size string) (float64, error) {
	re := regexp.MustCompile(`([\d.]+)MB`)
	match := re.FindStringSubmatch(size)
	if len(match) == 2 {
		var result float64
		fmt.Sscanf(match[1], "%f", &result)
		return result, nil
	}
	return 0, errors.New("invalid size format")
}

func containsBlockedTerms(target string) bool {
	// Split the blocked terms by comma
	blockedTerms := strings.Split(config.DefaultString("download::blockedterms", ""), ",")

	// Iterate through each blocked term and check if it exists in the target string
	for _, term := range blockedTerms {
		trimmedTerm := strings.TrimSpace(term) // Trim any extra whitespace
		if trimmedTerm != "" && strings.Contains(target, strings.ToLower(trimmedTerm)) {
			return true
		}
	}
	return false
}
