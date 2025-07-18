package middlewares

import (
	"api/models"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

func validateTokenAndGetUser(token string) (*models.User, error) {
	absUrl, err := config.String("general::audiobookshelfurl")
	if err != nil || absUrl == "" {
		logs.Critical("Missing general::audiobookshelfurl config... Unable to authenticate.")
		return nil, fmt.Errorf("Missing general::audiobookshelfurl config")
	}

	url := fmt.Sprintf("%s/api/me", absUrl)
	logs.Debug("Validating token against: %s", url)

	req, err := http.NewRequest("GET", url, &bytes.Buffer{})
	if err != nil {
		logs.Error("Failed to create request: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		logs.Error("Error occurred with request to %s: %v", url, err)
		return nil, err
	}
	defer resp.Body.Close()

	logs.Debug("Audiobookshelf response status: %d", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		logs.Debug("Token validation failed with status %d", resp.StatusCode)
		return nil, nil
	}

	user := new(models.User)
	if err := json.NewDecoder(resp.Body).Decode(user); err != nil {
		logs.Error("Failed to decode user response: %v", err)
		return nil, err
	}

	logs.Debug("Successfully validated token for user: %s", user.Username)
	return user, nil
}
