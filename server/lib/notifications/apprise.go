package notifications

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

func sendAppriseNotification(title, body string) error {
	appriseServer := config.DefaultString("notify::appriseserver", "")
	appriseService := config.DefaultString("notify::appriseservice", "")

	// Define the request payload
	payload := map[string]string{
		"urls":  appriseService,
		"body":  body,
		"title": title,
	}

	// Convert payload to JSON
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("Error marshalling JSON:", err)
		return err
	}

	resp, err := http.Post(appriseServer, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send message: status code %d", resp.StatusCode)
	}

	logs.Info("Telegram message sent successfully!")
	return nil
}
