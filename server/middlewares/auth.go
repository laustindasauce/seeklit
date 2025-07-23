package middlewares

import (
	"net/http"
	"strings"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	"github.com/beego/beego/v2/server/web/context"
)

// AuthMiddleware is a unified middleware that supports both OIDC and Audiobookshelf authentication
func AuthMiddleware(ctx *context.Context) {
	authHeader := ctx.Request.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		respondWithAuthError(ctx, "missing or invalid token")
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Determine which authentication method to use based on configuration
	authMethod := config.DefaultString("auth::method", "audiobookshelf")
	
	user, authSource := authenticateToken(token, authMethod)
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