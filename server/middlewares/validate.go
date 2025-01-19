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

	req, err := http.NewRequest("GET", url, &bytes.Buffer{})
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		logs.Debug("Error occurred with request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, nil
	}

	user := new(models.User)
	if err := json.NewDecoder(resp.Body).Decode(user); err != nil {
		return nil, err
	}

	return user, nil
}
