// @APIVersion 0.1.0
// @Title Seeklit Server
// @Description Rest API for book request application
// @Contact l@ustindasauce.com
// @License MIT
// @LicenseUrl https://github.com/laustindasauce/seeklit/blob/main/LICENSE
package routers

import (
	"api/controllers"
	"api/middlewares"

	beego "github.com/beego/beego/v2/server/web"
)

func init() {
	ns := beego.NewNamespace("/api",
		beego.NSNamespace("/v1",
			beego.NSNamespace("/auth",
				beego.NSInclude(
					&controllers.AuthController{},
				),
				beego.NSNamespace("/userinfo",
					beego.NSBefore(middlewares.AuthMiddleware),
					beego.NSInclude(
						&controllers.AuthController{},
					),
				),
			),
			beego.NSNamespace("/settings",
				beego.NSInclude(
					&controllers.MonitoringController{},
				),
				beego.NSNamespace("/config",
					beego.NSBefore(middlewares.AuthMiddleware),
					beego.NSInclude(
						&controllers.ConfigController{},
					),
				),
			),
			beego.NSNamespace("/requests",
				beego.NSBefore(middlewares.AuthMiddleware),
				beego.NSInclude(
					&controllers.RequestController{},
				),
			),
			beego.NSNamespace("/issues",
				beego.NSBefore(middlewares.AuthMiddleware),
				beego.NSInclude(
					&controllers.IssueController{},
				),
			),
			beego.NSNamespace("/search",
				beego.NSBefore(middlewares.AuthSearchMiddleware),
				beego.NSInclude(
					&controllers.SearchController{},
				),
			),
			beego.NSNamespace("/user",
				beego.NSBefore(middlewares.AuthMiddleware),
				beego.NSNamespace("/preferences",
					beego.NSInclude(
						&controllers.UserPreferencesController{},
					),
				),
			),
		),
	)
	beego.AddNamespace(ns)
}
