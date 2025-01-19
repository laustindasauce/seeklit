package middlewares

import (
	"api/models"

	"github.com/beego/beego/v2/core/logs"
	"github.com/beego/beego/v2/server/web/context"
)

func GetUser(ctx *context.Context) *models.User {
	userData := ctx.Input.GetData("user")
	user, ok := userData.(*models.User)
	if !ok {
		logs.Warn("Unable to parse user from middleware.")
		return nil
	}

	return user
}
