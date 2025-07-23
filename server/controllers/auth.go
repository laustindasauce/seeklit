package controllers

import (
	"api/helpers"
	"api/middlewares"
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"

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
	// Check if OIDC is enabled
	authMethod := config.DefaultString("auth::method", "audiobookshelf")
	if authMethod != "oidc" && authMethod != "both" {
		c.Ctx.Output.SetStatus(http.StatusNotFound)
		c.Data["json"] = map[string]string{"error": "OIDC login not available"}
		c.ServeJSON()
		return
	}

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
// @Success 200 {object} map[string]interface{}
// @router /info [get]
func (c *AuthController) AuthInfo() {
	authMethod := config.DefaultString("auth::method", "audiobookshelf")

	// Check if OIDC is actually available (not just configured)
	oidcAvailable := false
	if authMethod == "oidc" || authMethod == "both" {
		// OIDC is only available if both provider and config are initialized
		oidcAvailable = middlewares.GetOIDCProvider() != nil && middlewares.GetOAuth2Config() != nil
	}

	info := map[string]interface{}{
		"method": authMethod,
		"available_methods": map[string]bool{
			"audiobookshelf": authMethod == "audiobookshelf" || authMethod == "both",
			"oidc":           oidcAvailable,
		},
	}

	// Add OIDC-specific info if available
	if oidcAvailable {
		info["oidc"] = map[string]interface{}{
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
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router /callback [get]
func (c *AuthController) Callback() {
	// Check if OIDC is enabled
	authMethod := config.DefaultString("auth::method", "audiobookshelf")
	if authMethod != "oidc" && authMethod != "both" {
		c.Ctx.Output.SetStatus(http.StatusNotFound)
		c.Data["json"] = map[string]string{"error": "OIDC callback not available"}
		c.ServeJSON()
		return
	}
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

	// Store tokens in session for the frontend to retrieve
	err = sessionHelper.Set("access_token", oauth2Token.AccessToken)
	if err != nil {
		logs.Error("Failed to store access token in session: %v", err)
	}

	err = sessionHelper.Set("id_token", rawIDToken)
	if err != nil {
		logs.Error("Failed to store ID token in session: %v", err)
	}

	if oauth2Token.RefreshToken != "" {
		err = sessionHelper.Set("refresh_token", oauth2Token.RefreshToken)
		if err != nil {
			logs.Error("Failed to store refresh token in session: %v", err)
		}
	}

	// Store user info in session
	userInfo := map[string]interface{}{
		"id":       claims.Sub,
		"username": getPreferredUsername(claims),
		"email":    claims.Email,
		"name":     claims.Name,
		"groups":   claims.Groups,
		"roles":    claims.Roles,
	}
	err = sessionHelper.Set("user_info", userInfo)
	if err != nil {
		logs.Error("Failed to store user info in session: %v", err)
	}

	// Redirect to frontend auth callback route (same domain)
	redirectURL := "/auth/callback?success=true"

	logs.Info("Redirecting to frontend: %s", redirectURL)
	c.Redirect(redirectURL, http.StatusFound)
}

// @Title Logout
// @Description Logout user and optionally redirect to OIDC provider logout
// @Success 200 {object} map[string]string
// @router /logout [post]
func (c *AuthController) Logout() {
	// Clear any server-side session data using our custom session helper
	sessionHelper := helpers.NewSessionHelper(&c.Controller)
	sessionHelper.Destroy()

	// You might want to redirect to the OIDC provider's logout endpoint
	// This depends on your OIDC provider's capabilities
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

	response := map[string]interface{}{
		"user":        user,
		"auth_source": authSource,
	}

	c.Data["json"] = response
	c.ServeJSON()
}

// @Title GetAuthTokens
// @Description Get authentication tokens from session after OAuth callback
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @router /tokens [get]
func (c *AuthController) GetAuthTokens() {
	sessionHelper := helpers.NewSessionHelper(&c.Controller)

	// Check if tokens exist in session
	accessToken, hasAccess := sessionHelper.Get("access_token")
	idToken, hasID := sessionHelper.Get("id_token")
	userInfo, hasUser := sessionHelper.Get("user_info")

	if !hasAccess || !hasID || !hasUser {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "No authentication tokens found"}
		c.ServeJSON()
		return
	}

	// Get refresh token if it exists
	refreshToken, _ := sessionHelper.Get("refresh_token")

	response := map[string]interface{}{
		"access_token":  accessToken,
		"id_token":      idToken,
		"refresh_token": refreshToken,
		"user":          userInfo,
	}

	// Clear tokens from session after retrieval (optional - depends on your security requirements)
	// sessionHelper.Delete("access_token")
	// sessionHelper.Delete("id_token")
	// sessionHelper.Delete("refresh_token")
	// sessionHelper.Delete("user_info")

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
