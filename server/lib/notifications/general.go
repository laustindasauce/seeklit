package notifications

import (
	"fmt"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

func SendNotification(message string) {
	if config.DefaultBool("notify::telegramenabled", false) {
		err := sendTelegramNotification(message)
		if err != nil {
			logs.Warn("Unable to send telegarm notification: %v\n", err)
			logs.Info(message)
		}
	}
}

func SendErrorNotification(location, info string, err error) {
	title := "⛔☢️⛔ Seeklit application caught an error!\n"
	message := fmt.Sprintf("%sLocation: %s\nInfo: %s\nError: %v", title, location, info, err)

	if config.DefaultBool("notify::telegramenabled", false) {
		err := sendTelegramNotification(message)
		if err != nil {
			logs.Warn("Unable to send telegarm notification: %v\n", err)
			logs.Warn(message)
		}
	}
}
