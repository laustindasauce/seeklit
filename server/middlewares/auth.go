package middlewares

import (
	"api/helpers"
	"api/lib"
	"net/http"
	"strings"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	"github.com/beego/beego/v2/server/web/context"
)

// AuthMiddleware is a unified middleware that supports session cookies, OIDC, and Audiobookshelf authentication
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

	// If session auth failed or token came from header, try other methods
	if user == nil {
		authMethod := config.DefaultString("auth::method", "audiobookshelf")
		user, authSource = authenticateToken(token, authMethod)
	}

	if user == nil {
		respondWithAuthError(ctx, "invalid or expired token")
		return
	}

	// Store user information and auth source in the context
	ctx.Input.SetData("user", user)
	ctx.Input.SetData("auth_source", authSource)
}

// authenticateToken attempts to authenticate a token using the specified method
func authenticateToken(token, authMethod string) (interface{}, string) {
	switch authMethod {
	case "oidc":
		if user, err := validateOIDCTokenAndGetUser(token); err == nil && user != nil {
			logs.Debug("Successfully authenticated via OIDC")
			return user, "oidc"
		} else {
			logs.Debug("OIDC token validation failed: %v", err)
		}
	case "audiobookshelf":
		if user, err := validateTokenAndGetUser(token); err == nil && user != nil {
			logs.Debug("Successfully authenticated via Audiobookshelf")
			return user, "audiobookshelf"
		} else {
			logs.Debug("Audiobookshelf token validation failed: %v", err)
		}
	case "both":
		// Try OIDC first
		if user, err := validateOIDCTokenAndGetUser(token); err == nil && user != nil {
			logs.Debug("Successfully authenticated via OIDC")
			return user, "oidc"
		} else {
			logs.Debug("OIDC validation failed, trying audiobookshelf: %v", err)
		}
		
		// Fall back to audiobookshelf
		if user, err := validateTokenAndGetUser(token); err == nil && user != nil {
			logs.Debug("Successfully authenticated via Audiobookshelf (fallback)")
			return user, "audiobookshelf"
		} else {
			logs.Debug("Audiobookshelf validation also failed: %v", err)
		}
	default:
		logs.Error("Unknown auth method: %s", authMethod)
	}
	
	return nil, ""
}

// respondWithAuthError sends a standardized authentication error response
func respondWithAuthError(ctx *context.Context, message string) {
	ctx.Output.SetStatus(http.StatusUnauthorized)
	_ = ctx.Output.JSON(map[string]string{"error": message}, false, false)
}

// IsOIDCEnabled returns true if OIDC authentication is enabled
func IsOIDCEnabled() bool {
	authMethod := config.DefaultString("auth::method", "audiobookshelf")
	return authMethod == "oidc" || authMethod == "both"
}

// IsAudiobookshelfEnabled returns true if Audiobookshelf authentication is enabled
func IsAudiobookshelfEnabled() bool {
	authMethod := config.DefaultString("auth::method", "audiobookshelf")
	return authMethod == "audiobookshelf" || authMethod == "both"
}

// AuthSearchMiddleware is similar to AuthMiddleware but for search endpoints
func AuthSearchMiddleware(ctx *context.Context) {
	// For now, use the same logic as AuthMiddleware
	// You can customize this if search needs different auth behavior
	AuthMiddleware(ctx)
}