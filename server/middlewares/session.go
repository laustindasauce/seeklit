package middlewares

import (
	"api/helpers"
	"api/lib"
	"net/http"
	"strings"

	"github.com/beego/beego/v2/core/logs"
	"github.com/beego/beego/v2/server/web/context"
)

// SessionAuthMiddleware validates session cookies
func SessionAuthMiddleware(ctx *context.Context) {
	// First try to get token from Authorization header (for API compatibility)
	authHeader := ctx.Request.Header.Get("Authorization")
	var sessionToken string
	
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		sessionToken = strings.TrimPrefix(authHeader, "Bearer ")
	} else {
		// Fall back to cookie
		sessionToken = ctx.GetCookie(helpers.SessionCookieName)
	}

	if sessionToken == "" {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "missing session token"}, false, false)
		return
	}

	// Validate session
	sessionStore := lib.GetSessionStore()
	sessionData, exists := sessionStore.GetAuthSession(sessionToken)
	if !exists {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "invalid or expired session"}, false, false)
		return
	}

	// Convert session data to user model
	user := sessionStore.GetUserFromAuthSession(sessionData)
	
	// Store user information in the context
	ctx.Input.SetData("user", user)
	ctx.Input.SetData("auth_source", sessionData.AuthSource)
	
	logs.Debug("Session auth successful for user: %s (source: %s)", user.Username, sessionData.AuthSource)
}

// SessionAuthSearchMiddleware is a variant for search endpoints
func SessionAuthSearchMiddleware(ctx *context.Context) {
	// Use the same logic as the main middleware
	SessionAuthMiddleware(ctx)
}