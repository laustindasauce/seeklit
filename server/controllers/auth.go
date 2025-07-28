package controllers

import (
	"api/helpers"
	"api/lib"
	"api/middlewares"
	"api/models"
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
	"github.com/coreos/go-oidc/v3/oidc"
)

type AuthController struct {
	beego.Controller
}

// @Title Login
// @Description Initiate OIDC login flow
// @Success 302 {string} redirect to OIDC provider
// @Failure 500 {object} map[string]string
// @router /login [get]
func (c *AuthController) Login() {

	logs.Info("Retrieving config")

	oauth2Config := middlewares.GetOAuth2Config()
	if oauth2Config == nil {
		logs.Error("OIDC OAuth2 config is nil - OIDC may not be properly initialized")
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "OIDC not configured properly"}
		c.ServeJSON()
		return
	}

	logs.Info("Config: %v\n", oauth2Config)

	// Generate state parameter for CSRF protection
	state, err := generateRandomState()
	if err != nil {
		logs.Error("Failed to generate state: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to generate state"}
		c.ServeJSON()
		return
	}

	logs.Info("Setting the session with state: %s\n", state)

	// Store state in session using custom session helper
	sessionHelper := helpers.NewSessionHelper(&c.Controller)
	err = sessionHelper.Set("oauth_state", state)
	if err != nil {
		logs.Error("Failed to set session state: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to store session state"}
		c.ServeJSON()
		return
	}

	logs.Info("Session state stored successfully")

	logs.Info("Getting auth URL")

	// Redirect to OIDC provider
	authURL := oauth2Config.AuthCodeURL(state)
	logs.Info("Redirecting to OIDC provider: %s", authURL)
	c.Redirect(authURL, http.StatusFound)
}

// @Title AuthInfo
// @Description Get available authentication methods and configuration
// @Success 200 {object} map[string]any
// @router /info [get]
func (c *AuthController) AuthInfo() {
	// OIDC is only available if both provider and config are initialized
	oidcAvailable := middlewares.GetOIDCProvider() != nil && middlewares.GetOAuth2Config() != nil

	// Get auto-redirect setting
	autoRedirect := config.DefaultBool("auth::autoredirect", true)

	info := map[string]any{
		"method": "oidc",
		"available_methods": map[string]bool{
			"audiobookshelf": false,
			"oidc":           oidcAvailable,
		},
		"auto_redirect": autoRedirect,
	}

	// Add OIDC-specific info if available
	if oidcAvailable {
		info["oidc"] = map[string]any{
			"login_url":    "/api/v1/auth/login",
			"callback_url": "/api/v1/auth/callback",
		}
	}

	c.Data["json"] = info
	c.ServeJSON()
}

// @Title Callback
// @Description Handle OIDC callback
// @Param code query string true "Authorization code"
// @Param state query string true "State parameter"
// @Success 200 {object} map[string]any
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router /callback [get]
func (c *AuthController) Callback() {
	// Verify state parameter
	state := c.GetString("state")
	sessionHelper := helpers.NewSessionHelper(&c.Controller)

	sessionState, exists := sessionHelper.Get("oauth_state")
	if !exists || sessionState == nil || state != sessionState.(string) {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "Invalid state parameter"}
		c.ServeJSON()
		return
	}

	// Clear the state from session
	err := sessionHelper.Delete("oauth_state")
	if err != nil {
		logs.Error("Failed to clear session state: %v", err)
		// Continue anyway, this is not critical
	}

	code := c.GetString("code")
	if code == "" {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "Missing authorization code"}
		c.ServeJSON()
		return
	}

	oauth2Config := middlewares.GetOAuth2Config()
	provider := middlewares.GetOIDCProvider()

	if oauth2Config == nil || provider == nil {
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "OIDC not configured"}
		c.ServeJSON()
		return
	}

	ctx := context.Background()

	// Exchange authorization code for tokens
	oauth2Token, err := oauth2Config.Exchange(ctx, code)
	if err != nil {
		logs.Error("Failed to exchange code for token: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to exchange authorization code"}
		c.ServeJSON()
		return
	}

	// Extract ID token
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "No ID token in response"}
		c.ServeJSON()
		return
	}

	// Verify ID token
	verifier := provider.Verifier(&oidc.Config{ClientID: oauth2Config.ClientID})
	idToken, err := verifier.Verify(ctx, rawIDToken)
	if err != nil {
		logs.Error("Failed to verify ID token: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to verify ID token"}
		c.ServeJSON()
		return
	}

	// Extract user information from ID token
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
		logs.Error("Failed to parse claims: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to parse user claims"}
		c.ServeJSON()
		return
	}

	// Get user permissions from OIDC claims
	permissions := getUserPermissionsFromClaims(claims)

	// Determine user type based on admin permissions
	userType := "user"
	if permissions.Update && permissions.Delete && permissions.Upload {
		userType = "admin"
	}

	// Create a new session with our own token
	sessionStore := lib.GetSessionStore()
	sessionToken, err := sessionStore.CreateAuthSession(
		claims.Sub,
		getPreferredUsername(claims),
		claims.Email,
		claims.Name,
		userType,
		claims.Groups,
		claims.Roles,
		"oidc",
		permissions,
	)
	if err != nil {
		logs.Error("Failed to create session: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "Failed to create session"}
		c.ServeJSON()
		return
	}

	// Set secure session cookie
	cookieHelper := helpers.NewCookieHelper(&c.Controller)
	sessionDuration := config.DefaultInt("auth::session_duration_hours", 24)
	cookieHelper.SetSessionCookie(sessionToken, sessionDuration*3600) // Convert hours to seconds

	logs.Debug("OIDC callback - created session for user: %s, type: %s, roles: %v, groups: %v",
		getPreferredUsername(claims), userType, claims.Roles, claims.Groups)

	// Redirect to frontend auth callback route
	redirectURL := "/auth/callback?success=true"

	logs.Info("Redirecting to frontend: %s", redirectURL)
	c.Redirect(redirectURL, http.StatusFound)
}

// @Title Logout
// @Description Logout user and clear session
// @Success 200 {object} map[string]string
// @router /logout [post]
func (c *AuthController) Logout() {
	// Get session token from cookie
	cookieHelper := helpers.NewCookieHelper(&c.Controller)
	sessionToken := cookieHelper.GetSessionCookie()

	if sessionToken != "" {
		// Delete the session from our session store
		sessionStore := lib.GetSessionStore()
		sessionStore.DestroySession(sessionToken)

		logs.Debug("Logged out user with session token: %s", sessionToken[:8]+"...")
	}

	// Clear the session cookie
	cookieHelper.ClearSessionCookie()

	// Clear any legacy session data
	sessionHelper := helpers.NewSessionHelper(&c.Controller)
	sessionHelper.Destroy()

	c.Data["json"] = map[string]string{"message": "Logged out successfully"}
	c.ServeJSON()
}

// @Title UserInfo
// @Description Get current user information from token
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]string
// @router /userinfo [get]
func (c *AuthController) UserInfo() {
	// This endpoint uses the unified auth middleware to validate the token
	user := c.Ctx.Input.GetData("user")
	authSource := c.Ctx.Input.GetData("auth_source")

	if user == nil {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "No user information available"}
		c.ServeJSON()
		return
	}

	response := map[string]any{
		"user":        user,
		"auth_source": authSource,
	}

	logs.Debug("User from user info: %v\n", user)

	c.Data["json"] = response
	c.ServeJSON()
}

// @Title GetAuthTokens
// @Description Get current user information from session cookie
// @Success 200 {object} map[string]any
// @Failure 401 {object} map[string]string
// @router /tokens [get]
func (c *AuthController) GetAuthTokens() {
	// Get session token from cookie
	cookieHelper := helpers.NewCookieHelper(&c.Controller)
	sessionToken := cookieHelper.GetSessionCookie()

	if sessionToken == "" {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "No session cookie found"}
		c.ServeJSON()
		return
	}

	// Get session data
	sessionStore := lib.GetSessionStore()
	sessionData, exists := sessionStore.GetAuthSession(sessionToken)
	if !exists {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "Invalid or expired session"}
		c.ServeJSON()
		return
	}

	// Create user object that matches client expectations
	user := map[string]any{
		"id":          sessionData.UserID,
		"username":    sessionData.Username,
		"email":       sessionData.Email,
		"name":        sessionData.Name,
		"groups":      sessionData.Groups,
		"roles":       sessionData.Roles,
		"type":        sessionData.UserType,
		"token":       sessionToken, // Provide session token for compatibility
		"auth_source": sessionData.AuthSource,
		"permissions": sessionData.Permissions,
	}

	response := map[string]any{
		"user":        user,
		"auth_source": sessionData.AuthSource, // Add auth_source at top level for compatibility
		"cookie":      sessionToken,           // Add cookie field to match expected format
	}

	c.Data["json"] = response
	c.ServeJSON()
}

func generateRandomState() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func getPreferredUsername(claims struct {
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

func getUserPermissionsFromClaims(claims struct {
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

	for _, role := range claims.Roles {
		for _, adminRole := range adminRoles {
			if strings.EqualFold(role, adminRole) {
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
				permissions.Update = true
				permissions.Delete = true
				permissions.Upload = true
				return permissions
			}
		}
	}

	return permissions
}
