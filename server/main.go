package main

import (
	"api/database"
	"api/helpers"
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
}

func main() {
	if config.DefaultString("runmode", "prod") == "dev" {
		logs.Info("Running in dev mode!")
		beego.BConfig.WebConfig.DirectoryIndex = true
		beego.BConfig.WebConfig.StaticDir["/swagger"] = "swagger"
	}

	logs.Debug("Starting application")

	beego.Run()
}
