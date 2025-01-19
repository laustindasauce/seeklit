package controllers

import (
	"api/middlewares"
	"api/models"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
)

// Operations for search
type SearchController struct {
	beego.Controller
}

// @Title Google Search
// @Description perform google search
// @Param	body		body 	models.Search	true		"body for search content"
// @Success 200 {object} map[string]any
// @router /google [post]
func (s *SearchController) GoogleSearch() {
	user := middlewares.GetUser(s.Ctx)

	search := new(models.Search)
	if err := json.Unmarshal(s.Ctx.Input.RequestBody, &search); err != nil {
		logs.Warn("Error unmarshalling google search body: %v\n", err)
		s.Ctx.Output.SetStatus(http.StatusBadRequest)
		s.Data["json"] = map[string]string{"error": "Unable to parse search in body."}
		s.ServeJSON()
		return
	}

	apiKey, err := config.String("metadata::googleapikey")
	if err != nil {
		logs.Critical("Missing metadata::googleapikey in config file. Unable to perform book search with Google.")
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		s.Data["json"] = map[string]string{"error": "Unable to perform search."}
		s.ServeJSON()
		return
	}

	// Define the endpoint and query parameters
	endpoint := "https://www.googleapis.com/books/v1/volumes"
	params := url.Values{}
	params.Add("q", search.Query)
	params.Add("key", apiKey)
	params.Add("maxResults", "40")

	// Build the full URL with query parameters
	fullURL := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	// Create an HTTP client with a timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Make the GET request
	resp, err := client.Get(fullURL)
	if err != nil {
		logs.Critical("Error fetching data: %v", err)
		return
	}
	defer resp.Body.Close()

	// Check if the status code is OK
	if resp.StatusCode != http.StatusOK {
		logs.Critical("Error: Received status code %d", resp.StatusCode)
		return
	}

	// Decode the response body into a struct
	var data models.GoogleBooksResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		logs.Critical("Error decoding JSON response: %v", err)
		return
	}

	absResults, err := handleAbsSearch(user.Token, search.Query)
	if err != nil {
		logs.Warn("Unable to complete audiobookshelf search.")
		absResults = []any{}
	}

	// Return the search results
	result := map[string]any{
		"search_results": data.Items,
		"abs_results":    absResults,
	}

	s.Data["json"] = result

	s.ServeJSON()
}

// @Title OpenLibrary Search
// @Description perform Open Library search
// @Param	body		body 	models.Search	true		"body for search content"
// @Success 200 {object} map[string]any
// @router /openlib [post]
func (s *SearchController) OpenLibrarySearch() {
	user := middlewares.GetUser(s.Ctx)

	search := new(models.Search)
	if err := json.Unmarshal(s.Ctx.Input.RequestBody, &search); err != nil {
		logs.Warn("Error unmarshalling Open Library search body: %v\n", err)
		s.Ctx.Output.SetStatus(http.StatusBadRequest)
		s.Data["json"] = map[string]string{"error": "Unable to parse search in body."}
		s.ServeJSON()
		return
	}

	// Define the endpoint and query parameters
	endpoint := "https://openlibrary.org/search.json"
	params := url.Values{}
	params.Add("q", search.Query)
	params.Add("fields", "seed,author_name,title,cover_i")
	params.Add("limit", "40")

	// Build the full URL with query parameters
	fullURL := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	// Create an HTTP client with a timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Make the GET request
	resp, err := client.Get(fullURL)
	if err != nil {
		logs.Critical("Error fetching data: %v", err)
		return
	}
	defer resp.Body.Close()

	// Check if the status code is OK
	if resp.StatusCode != http.StatusOK {
		logs.Critical("Error: Received status code %d", resp.StatusCode)
		return
	}

	// Decode the response body into a struct
	var data models.OpenLibraryResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		logs.Critical("Error decoding JSON response: %v", err)
		return
	}

	for id := range data.Docs {
		data.Docs[id].SetInfoLink()
		data.Docs[id].SetCoverImage()
	}

	absResults, err := handleAbsSearch(user.Token, search.Query)
	if err != nil {
		logs.Warn("Unable to complete audiobookshelf search.")
		absResults = []any{}
	}

	// Return the search results
	result := map[string]any{
		"search_results": data,
		"abs_results":    absResults,
	}

	s.Data["json"] = result

	s.ServeJSON()
}

// @Title Hardcover Search **UNSTABLE**
// @Description perform Hardcover search
// @Param	body		body 	models.Search	true		"body for search content"
// @Success 200 {object} map[string]any
// @router /hardcover [post]
func (s *SearchController) HardcoverSearch() {
	user := middlewares.GetUser(s.Ctx)

	search := new(models.Search)
	if err := json.Unmarshal(s.Ctx.Input.RequestBody, &search); err != nil {
		logs.Warn("Error unmarshalling Open Library search body: %v\n", err)
		s.Ctx.Output.SetStatus(http.StatusBadRequest)
		s.Data["json"] = map[string]string{"error": "Unable to parse search in body."}
		s.ServeJSON()
		return
	}

	bearerToken, err := config.String("metadata::hardcoverbearertoken")
	if err != nil {
		logs.Critical("Missing metadata::hardcoverbearertoken in config file. Unable to perform book search with Hardcover.")
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		s.Data["json"] = map[string]string{"error": "Unable to perform search."}
		s.ServeJSON()
		return
	}

	query := `
    query BookSearch($search: String!) {
      books(
        where: {title: {_ilike: $search}, users_read_count: {_gt: 0}}
        order_by: [{users_count: desc_nulls_last}, {description: desc_nulls_last}]
        limit: 40
      ) {
        title
        id
        slug
        users_read_count
        users_count
        cached_image
        description
        contributions {
          author {
            name
            id
          }
        }
        images {
          url
        }
        default_physical_edition {
          isbn_10
          isbn_13
        }
      }
    }
    `

	variables := map[string]string{
		"search": "%" + search.Query + "%",
	}

	payload := map[string]any{
		"query":     query,
		"variables": variables,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		logs.Critical("Error marshalling JSON payload: %v", err)
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		s.Data["json"] = map[string]string{"error": "Failed to create request payload."}
		s.ServeJSON()
		return
	}

	// Define the endpoint and query parameters
	fullURL := "https://hardcover-hasura-production-1136269bb9de.herokuapp.com/v1/graphql"
	headers := map[string]string{
		"Content-Type":  "application/json",
		"authorization": fmt.Sprintf("Bearer %s", bearerToken), // Add your authorization header if needed
	}

	// Create a new HTTP POST request
	req, err := http.NewRequest("POST", fullURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		logs.Critical("Error creating HTTP request: %v", err)
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		s.Data["json"] = map[string]string{"error": "Failed to create HTTP request."}
		s.ServeJSON()
		return
	}

	// Set headers
	for key, value := range headers {
		req.Header.Set(key, value)
		logs.Info("Header %s: %s", key, value)
	}

	// Create an HTTP client and send the request
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		logs.Critical("Error sending HTTP request: %v", err)
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		s.Data["json"] = map[string]string{"error": "Failed to fetch data."}
		s.ServeJSON()
		return
	}
	defer resp.Body.Close()

	// Check if the status code is OK
	if resp.StatusCode != http.StatusOK {
		logs.Critical("Error: Received status code %d", resp.StatusCode)
		return
	}

	// Decode the response body into a struct
	var data models.HardcoverResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		logs.Critical("Error decoding JSON response: %v", err)
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		return
	}

	if data.Errors != nil {
		logs.Critical("Error response from hardcover: %v", data.Errors)
		s.Ctx.Output.SetStatus(http.StatusInternalServerError)
		return
	}

	for id, book := range data.Data.Books {
		if book.CachedImage != nil {
			data.Data.Books[id].Images = []models.HardcoverImage{{URL: book.CachedImage.URL}}
		}
	}

	absResults, err := handleAbsSearch(user.Token, search.Query)
	if err != nil {
		logs.Warn("Unable to complete audiobookshelf search.")
		absResults = []any{}
	}

	// Return the search results
	result := map[string]any{
		"search_results": data.Data.Books,
		"abs_results":    absResults,
	}

	s.Data["json"] = result

	s.ServeJSON()
}

func handleAbsSearch(token string, query string) ([]any, error) {
	var booksInLibrary []any

	libraryIds, err := getLibraries(token)
	if err != nil {
		logs.Warning("Unable to retrieve libraries")
		return nil, err
	}

	booksInLibrary, err = searchLibraries(token, libraryIds, query)
	if err != nil {
		logs.Warning("Unable to search libraries")
		return nil, err
	}

	if booksInLibrary == nil {
		booksInLibrary = []any{}
	}

	return booksInLibrary, nil
}

func getLibraries(token string) ([]string, error) {
	logs.Info("Retrieving Audiobookshelf libraries...")
	absUrl, err := config.String("general::audiobookshelfurl")
	if err != nil || absUrl == "" {
		logs.Critical("Missing general::audiobookshelfurl config... Unable to authenticate.")
		return []string{}, fmt.Errorf("Missing general::audiobookshelfurl config")
	}

	url := fmt.Sprintf("%s/api/libraries", absUrl)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		logs.Critical("Error creating request: %v", err)
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		logs.Critical("Error fetching libraries: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Error: Received status code %d", resp.StatusCode)
	}

	var res map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		logs.Critical("Error decoding response: %v", err)
		return nil, err
	}

	// Extract library IDs from the raw JSON response
	libraries, ok := res["libraries"].([]any)
	if !ok {
		return nil, fmt.Errorf("Invalid response format, 'libraries' not found")
	}

	var libraryIds []string
	for _, library := range libraries {
		lib, ok := library.(map[string]any)
		if !ok {
			logs.Info("Invalid library entry format")
			continue
		}
		id, ok := lib["id"].(string)
		if !ok {
			logs.Info("Invalid library ID format")
			continue
		}
		libraryIds = append(libraryIds, id)
	}

	return libraryIds, nil
}

func getAuthorBooks(token, authorID string) ([]any, error) {
	logs.Info("Retrieving books for author...")
	absUrl, err := config.String("general::audiobookshelfurl")
	if err != nil || absUrl == "" {
		logs.Critical("Missing general::audiobookshelfurl config... Unable to authenticate.")
		return nil, fmt.Errorf("Missing general::audiobookshelfurl config")
	}

	params := url.Values{}
	params.Add("include", "items")

	// Build the full URL with query parameters
	fullUrl := fmt.Sprintf("%s/api/authors/%s?%s", absUrl, authorID, params.Encode())
	req, err := http.NewRequest("GET", fullUrl, nil)
	if err != nil {
		logs.Critical("Error creating request: %v", err)
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.URL.Query().Add("include", "items")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		logs.Critical("Error fetching author books: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Error: Received status code %d", resp.StatusCode)
	}

	var res map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		logs.Critical("Error decoding response: %v", err)
		return nil, err
	}

	// Extract books from the raw JSON response
	books, ok := res["libraryItems"].([]any)
	if !ok {
		logs.Info("Invalid response format, 'libraryItems' not found")
		return nil, fmt.Errorf("Invalid response format, 'libraryItems' not found")
	}

	// Format matching library response
	for id, book := range books {
		books[id] = map[string]any{"libraryItem": book}
	}

	return books, nil
}

func searchLibraries(token string, libraryIds []string, q string) ([]any, error) {
	logs.Info("Searching Audiobookshelf libraries for %s...", q)
	absUrl, err := config.String("general::audiobookshelfurl")
	if err != nil || absUrl == "" {
		logs.Critical("Missing general::audiobookshelfurl config... Unable to authenticate.")
		return nil, fmt.Errorf("Missing general::audiobookshelfurl config")
	}

	var allBooks []any
	for _, id := range libraryIds {
		logs.Info("Performing library search on library ID: %s", id)
		params := url.Values{}
		params.Add("q", q)

		// Build the full URL with query parameters
		absUrl = fmt.Sprintf("%s/api/libraries/%s/search?%s", absUrl, id, params.Encode())

		req, err := http.NewRequest("GET", absUrl, nil)
		if err != nil {
			logs.Warn("Error creating request: %v", err)
			continue
		}

		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
		encodedQuery := url.QueryEscape(q)
		req.URL.Query().Add("q", encodedQuery)
		logs.Debug("Encoded Query Parameters: %s", req.URL.Query().Encode())

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			logs.Critical("Error fetching search results: %v", err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			logs.Critical("Error: Received status code %d", resp.StatusCode)
			continue
		}

		var searchRes map[string]any
		if err := json.NewDecoder(resp.Body).Decode(&searchRes); err != nil {
			logs.Critical("Error decoding search response: %v", err)
			continue
		}

		// Handle books found
		books, ok := searchRes["book"].([]any)
		if ok {
			allBooks = append(allBooks, books...)
		}

		// Handle authors found
		authors, ok := searchRes["authors"].([]any)
		if ok && len(authors) > 0 {
			// Assuming we want books from the first author
			author := authors[0].(map[string]any)
			authorBooks, err := getAuthorBooks(token, author["id"].(string))
			if err != nil {
				logs.Critical("Error retrieving author books: %v", err)
				continue
			}

			for _, authorBook := range authorBooks {
				allBooks = append(allBooks, authorBook)
			}
		}
	}

	return allBooks, nil
}
