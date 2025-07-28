package middlewares

import (
	"api/models"
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	webcontext "github.com/beego/beego/v2/server/web/context"
	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

var (
	oidcProvider *oidc.Provider
	oauth2Config *oauth2.Config
	verifier     *oidc.IDTokenVerifier
)

// InitOIDC initializes the OIDC provider and configuration
func InitOIDC() error {
	// OIDC is always enabled in this configuration

	issuerURL, err := config.String("oidc::issuer")
	if err != nil || issuerURL == "" || issuerURL == "https://your-oidc-provider.com" {
		return fmt.Errorf("missing or invalid oidc::issuer config")
	}

	clientID, err := config.String("oidc::clientid")
	if err != nil || clientID == "" || clientID == "your-client-id" {
		return fmt.Errorf("missing or invalid oidc::clientid config")
	}

	clientSecret, err := config.String("oidc::clientsecret")
	if err != nil || clientSecret == "" || clientSecret == "your-client-secret" {
		return fmt.Errorf("missing or invalid oidc::clientsecret config")
	}

	redirectURL, err := config.String("oidc::redirecturl")
	if err != nil || redirectURL == "" {
		return fmt.Errorf("missing oidc::redirecturl config")
	}

	ctx := context.Background()
	provider, err := oidc.NewProvider(ctx, issuerURL)
	if err != nil {
		return fmt.Errorf("failed to create OIDC provider: %v", err)
	}

	oidcProvider = provider
	verifier = provider.Verifier(&oidc.Config{ClientID: clientID})

	oauth2Config = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	logs.Info("OIDC initialized successfully with issuer: %s", issuerURL)
	return nil
}

// OIDCAuthMiddleware validates OIDC JWT tokens
func OIDCAuthMiddleware(ctx *webcontext.Context) {
	authHeader := ctx.Request.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "missing or invalid token"}, false, false)
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Validate the OIDC token
	user, err := validateOIDCTokenAndGetUser(token)
	if err != nil || user == nil {
		logs.Debug("Token validation failed: %v", err)
		ctx.Output.SetStatus(http.StatusUnauthorized)
		_ = ctx.Output.JSON(map[string]string{"error": "invalid or expired token"}, false, false)
		return
	}

	// Store user information in the context
	ctx.Input.SetData("user", user)
}

// validateOIDCTokenAndGetUser validates an OIDC ID token and returns user information
func validateOIDCTokenAndGetUser(tokenString string) (*models.User, error) {
	if verifier == nil {
		return nil, fmt.Errorf("OIDC not initialized")
	}

	ctx := context.Background()

	// Verify the ID token
	idToken, err := verifier.Verify(ctx, tokenString)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %v", err)
	}

	// Extract claims from the token
	var claims struct {
		Sub               string   `json:"sub"`
		Name              string   `json:"name"`
		PreferredUsername string   `json:"preferred_username"`
		Email             string   `json:"email"`
		EmailVerified     bool     `json:"email_verified"`
		Groups            []string `json:"groups"`
		Roles             []string `json:"roles"`
	}

	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("failed to parse claims: %v", err)
	}

	// Get user permissions first to determine user type
	permissions := getUserPermissions(claims)
	
	// Determine user type based on admin permissions
	userType := "user"
	if permissions.Update && permissions.Delete && permissions.Upload {
		userType = "admin"
	}

	// Create user object from OIDC claims
	user := &models.User{
		ID:          claims.Sub,
		Username:    getUsername(claims),
		Type:        userType,
		Token:       tokenString,
		IsActive:    true,
		IsLocked:    false,
		LastSeen:    int(time.Now().Unix()),
		CreatedAt:   int(time.Now().Unix()),
		Permissions: permissions,
	}

	logs.Debug("Successfully validated OIDC token for user: %s (type: %s, admin: %t)", 
		user.Username, user.Type, user.Type == "admin")
	logs.Debug("User permissions - Update: %t, Delete: %t, Upload: %t", 
		user.Permissions.Update, user.Permissions.Delete, user.Permissions.Upload)
	return user, nil
}

// getUsername extracts username from OIDC claims with fallback logic
func getUsername(claims struct {
	Sub               string   `json:"sub"`
	Name              string   `json:"name"`
	PreferredUsername string   `json:"preferred_username"`
	Email             string   `json:"email"`
	EmailVerified     bool     `json:"email_verified"`
	Groups            []string `json:"groups"`
	Roles             []string `json:"roles"`
}) string {
	if claims.PreferredUsername != "" {
		return claims.PreferredUsername
	}
	if claims.Name != "" {
		return claims.Name
	}
	if claims.Email != "" {
		return claims.Email
	}
	return claims.Sub
}

// getUserPermissions determines user permissions based on OIDC claims
func getUserPermissions(claims struct {
	Sub               string   `json:"sub"`
	Name              string   `json:"name"`
	PreferredUsername string   `json:"preferred_username"`
	Email             string   `json:"email"`
	EmailVerified     bool     `json:"email_verified"`
	Groups            []string `json:"groups"`
	Roles             []string `json:"roles"`
}) models.UserPermissions {
	// Default permissions for regular users
	permissions := models.UserPermissions{
		Download:              true,
		Update:                false,
		Delete:                false,
		Upload:                false,
		AccessAllLibraries:    true,
		AccessAllTags:         true,
		AccessExplicitContent: true,
	}

	// Check for admin roles/groups
	adminRoles := []string{"admin", "administrator", "seeklit-admin"}
	adminGroups := []string{"admin", "administrators", "seeklit-admin"}

	logs.Debug("Checking admin permissions for user roles: %v, groups: %v", claims.Roles, claims.Groups)

	for _, role := range claims.Roles {
		for _, adminRole := range adminRoles {
			if strings.EqualFold(role, adminRole) {
				logs.Debug("Admin role detected: %s matches %s", role, adminRole)
				permissions.Update = true
				permissions.Delete = true
				permissions.Upload = true
				return permissions
			}
		}
	}

	for _, group := range claims.Groups {
		for _, adminGroup := range adminGroups {
			if strings.EqualFold(group, adminGroup) {
				logs.Debug("Admin group detected: %s matches %s", group, adminGroup)
				permissions.Update = true
				permissions.Delete = true
				permissions.Upload = true
				return permissions
			}
		}
	}

	logs.Debug("No admin roles/groups found, using default permissions")

	return permissions
}

// GetOAuth2Config returns the OAuth2 configuration for login flows
func GetOAuth2Config() *oauth2.Config {
	return oauth2Config
}

// GetOIDCProvider returns the OIDC provider
func GetOIDCProvider() *oidc.Provider {
	return oidcProvider
}
