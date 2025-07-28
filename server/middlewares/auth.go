package middlewares

import (
	"api/helpers"
	"api/lib"
	"net/http"
	"strings"

	"github.com/beego/beego/v2/core/logs"
	"github.com/beego/beego/v2/server/web/context"
)

// AuthMiddleware is a unified middleware that supports session cookies and OIDC authentication
func AuthMiddleware(ctx *context.Context) {
	// First try to get token from Authorization header
	authHeader := ctx.Request.Header.Get("Authorization")
	var token string
	var fromCookie bool

	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		token = strings.TrimPrefix(authHeader, "Bearer ")
		fromCookie = false
	} else {
		// Fall back to session cookie
		token = ctx.GetCookie(helpers.SessionCookieName)
		fromCookie = true
	}

	if token == "" {
		respondWithAuthError(ctx, "missing authentication token or session")
		return
	}

	var user interface{}
	var authSource string

	// If token came from cookie, try session authentication first
	if fromCookie {
		sessionStore := lib.GetSessionStore()
		if sessionData, exists := sessionStore.GetAuthSession(token); exists {
			user = sessionStore.GetUserFromAuthSession(sessionData)
			authSource = sessionData.AuthSource
			logs.Debug("Successfully authenticated via session cookie (source: %s)", authSource)
		}
	}

	// If session auth failed or token came from header, try OIDC authentication
	if user == nil {
		user, authSource = authenticateToken(token)
	}

	if user == nil {
		respondWithAuthError(ctx, "invalid or expired token")
		return
	}

	// Store user information and auth source in the context
	ctx.Input.SetData("user", user)
	ctx.Input.SetData("auth_source", authSource)
}

// authenticateToken attempts to authenticate a token using OIDC
func authenticateToken(token string) (interface{}, string) {
	if user, err := validateOIDCTokenAndGetUser(token); err == nil && user != nil {
		logs.Debug("Successfully authenticated via OIDC")
		return user, "oidc"
	} else {
		logs.Debug("OIDC token validation failed: %v", err)
	}

	return nil, ""
}

// respondWithAuthError sends a standardized authentication error response
func respondWithAuthError(ctx *context.Context, message string) {
	ctx.Output.SetStatus(http.StatusUnauthorized)
	_ = ctx.Output.JSON(map[string]string{"error": message}, false, false)
}

// IsOIDCEnabled returns true since OIDC is the only authentication method
func IsOIDCEnabled() bool {
	return true
}

// AuthSearchMiddleware is similar to AuthMiddleware but for search endpoints
func AuthSearchMiddleware(ctx *context.Context) {
	// For now, use the same logic as AuthMiddleware
	// You can customize this if search needs different auth behavior
	AuthMiddleware(ctx)
}
