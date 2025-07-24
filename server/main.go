package main

import (
	"api/database"
	"api/helpers"
	"api/middlewares"
	_ "api/routers"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"

	_ "github.com/joho/godotenv/autoload" // load .env file automatically
)

func init() {
	err := config.InitGlobalInstance("ini", helpers.GetEnv("SEEKLIT_CONF_FILE", "/config/seeklit.conf"))
	if err != nil {
		logs.Error(err)
	}
	val, _ := config.String("appname")
	logs.Info("Starting up", val)
	logs.SetLogger("Console")
	logs.SetLevel(config.DefaultInt("general::level", logs.LevelInfo))
	logs.Info("Logger initialized..")

	database.Connect()

	// Initialize OIDC if enabled
	if middlewares.IsOIDCEnabled() {
		if err := middlewares.InitOIDC(); err != nil {
			logs.Error("Failed to initialize OIDC: %v", err)
			logs.Error("OIDC authentication will not be available")
			// Continue running - the system can still use audiobookshelf auth
		} else {
			logs.Info("OIDC authentication initialized successfully")
		}
	} else {
		logs.Info("OIDC authentication disabled")
	}
}

func main() {
	if config.DefaultString("runmode", "prod") == "dev" {
		logs.Info("Running in dev mode!")
		beego.BConfig.WebConfig.DirectoryIndex = true
		beego.BConfig.WebConfig.StaticDir["/swagger"] = "swagger"
	}

	logs.Debug("Starting application")

	beego.BConfig.WebConfig.Session.SessionOn = true
	beego.BConfig.WebConfig.Session.SessionName = "seeklit_session"

	beego.Run()
}
