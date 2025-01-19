package notifications

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/beego/beego/v2/adapter/logs"
	"github.com/beego/beego/v2/core/config"
)

// sendTelegramNotification sends a message to a Telegram chat using the bot token and chat ID from the environment.
func sendTelegramNotification(message string) error {
	botToken := config.DefaultString("notify::telegrambottoken", "")
	chatID := config.DefaultString("notify::telegramchatid", "")

	if botToken == "" || chatID == "" {
		return errors.New("bot token or chat ID is not set in environment variables")
	}

	url := "https://api.telegram.org/bot" + botToken + "/sendMessage"

	payload := map[string]string{
		"chat_id": chatID,
		"text":    message,
	}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
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
