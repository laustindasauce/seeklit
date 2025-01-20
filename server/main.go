package main

import (
	"api/database"
	"api/helpers"
	_ "api/routers"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
	"github.com/beego/beego/v2/server/web/filter/cors"

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
		// Enable CORS for all routes
		beego.InsertFilter("*", beego.BeforeRouter, cors.Allow(&cors.Options{
			// AllowAllOrigins:  true,
			AllowOrigins:     []string{"http://localhost:3000"},
			AllowMethods:     []string{"GET", "POST", "PATCH", "PUT", "OPTIONS", "DELETE"},
			AllowHeaders:     []string{"Origin", "Authorization", "Content-Type", "Accept"},
			ExposeHeaders:    []string{"Content-Length", "Content-Type"},
			AllowCredentials: true,
		}))
		logs.Info("Running in dev mode!")
		beego.BConfig.WebConfig.DirectoryIndex = true
		beego.BConfig.WebConfig.StaticDir["/swagger"] = "swagger"
	}

	logs.Debug("Starting application")

	beego.Run()
}
