package middlewares

import (
	"net/http"
	"strings"

	"github.com/beego/beego/v2/server/web/context"
)

func JWTAuthMiddleware(ctx *context.Context) {
	authHeader := ctx.Request.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "missing or invalid token"}, false, false)
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Validate the token with the external service
	user, err := validateTokenAndGetUser(token)
	if err != nil || user == nil {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "invalid or expired token"}, false, false)
		return
	}

	// Store user information in the context
	ctx.Input.SetData("user", user)
}

func JWTAuthSearchMiddleware(ctx *context.Context) {
	authHeader := ctx.Request.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "missing or invalid token"}, false, false)
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Validate the token with the external service
	user, err := validateTokenAndGetUser(token)
	if err != nil || user == nil {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "invalid or expired token"}, false, false)
		return
	}

	// Store user information in the context
	ctx.Input.SetData("user", user)
}
