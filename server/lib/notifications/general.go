package notifications

import (
	"fmt"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

func SendNotification(title, body string) {
	if config.DefaultBool("notify::enabled", false) {
		err := sendAppriseNotification(title, body)
		if err != nil {
			logs.Warn("Unable to send notification: %v\n", err)
			logs.Info(title + "\n" + body)
		}
	}
}

func SendErrorNotification(location, info string, err error) {
	title := "⛔☢️⛔ Seeklit application caught an error!"
	body := fmt.Sprintf("Location: %s\nInfo: %s\nError: %v", location, info, err)

	if config.DefaultBool("notify::enabled", false) {
		err := sendAppriseNotification(title, body)
		if err != nil {
			logs.Warn("Unable to send notification: %v\n", err)
			logs.Warn(title + "\n" + body)
		}
	}
}
