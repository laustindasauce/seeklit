package controllers

import (
	"api/middlewares"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
)

// UserController handles user-related operations
type UserController struct {
	beego.Controller
}

// @Title Get Users
// @Description Get all users from audiobookshelf (admin/root only)
// @Success 200 {object} map[string]any
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router / [get]
func (c *UserController) GetUsers() {
	user := middlewares.GetUser(c.Ctx)
	if user == nil {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "Unauthorized"}
		c.ServeJSON()
		return
	}

	// Check if user is admin or root
	if !user.IsAdmin() {
		c.Ctx.Output.SetStatus(http.StatusForbidden)
		c.Data["json"] = map[string]string{"error": "Access denied. Admin or root privileges required."}
		c.ServeJSON()
		return
	}

	// Get auth method from config with default fallback
	authMethod := config.DefaultString("auth::method", "audiobookshelf")

	var token string

	// Determine which token to use based on auth method
	switch authMethod {
	case "oidc":
		absApiKey := config.DefaultString("general::audiobookshelfapikey", "")
		// For OIDC-only auth, fail if api key is empty
		if absApiKey == "" {
			logs.Critical("audiobookshelfapikey is empty and auth method is OIDC. Unable to get users.")
			c.Ctx.Output.SetStatus(http.StatusUnauthorized)
			c.Data["json"] = map[string]string{"error": "Audiobookshelf API Key required for user management."}
			c.ServeJSON()
			return
		}
		token = absApiKey
	case "audiobookshelf", "both":
		// Try API key first, fallback to user token
		token = config.DefaultString("general::audiobookshelfapikey", user.Token)
	default:
		logs.Critical("Unknown auth method: %s. Unable to get users.", authMethod)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Invalid authentication configuration."}
		c.ServeJSON()
		return
	}

	users, err := getAudiobookshelfUsers(token)
	if err != nil {
		logs.Error("Unable to get users from audiobookshelf: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to retrieve users"}
		c.ServeJSON()
		return
	}

	// Return the users in the expected format
	result := map[string]any{
		"users": users,
	}

	c.Data["json"] = result
	c.ServeJSON()
}

func getAudiobookshelfUsers(token string) ([]any, error) {
	logs.Info("Retrieving users from Audiobookshelf...")
	absUrl, err := config.String("general::audiobookshelfurl")
	if err != nil || absUrl == "" {
		logs.Critical("Missing general::audiobookshelfurl config... Unable to get users.")
		return nil, fmt.Errorf("missing general::audiobookshelfurl config")
	}

	url := fmt.Sprintf("%s/api/users", absUrl)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		logs.Critical("Error creating request: %v", err)
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		logs.Critical("Error fetching users: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error: Received status code %d", resp.StatusCode)
	}

	var res map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		logs.Critical("Error decoding response: %v", err)
		return nil, err
	}

	// Extract users from the response
	users, ok := res["users"].([]any)
	if !ok {
		return nil, fmt.Errorf("invalid response format, 'users' not found")
	}

	return users, nil
}
