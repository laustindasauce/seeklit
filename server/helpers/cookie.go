package helpers

import (
	"net/http"

	"github.com/beego/beego/v2/core/config"
	beego "github.com/beego/beego/v2/server/web"
)

const SessionCookieName = "seeklit_session"

// CookieHelper provides utilities for managing session cookies
type CookieHelper struct {
	controller *beego.Controller
}

// NewCookieHelper creates a new cookie helper
func NewCookieHelper(controller *beego.Controller) *CookieHelper {
	return &CookieHelper{
		controller: controller,
	}
}

// SetSessionCookie sets a secure session cookie
func (h *CookieHelper) SetSessionCookie(sessionToken string, maxAge int) {
	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    sessionToken,
		Path:     config.DefaultString("auth::cookie_path", "/"),
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   isSecureContext(),
		SameSite: getSameSiteMode(),
	}

	// Set domain if configured
	if domain := config.DefaultString("auth::cookie_domain", ""); domain != "" {
		cookie.Domain = domain
	}

	h.controller.Ctx.Output.Cookie(cookie.Name, cookie.Value, cookie.MaxAge,
		cookie.Path, cookie.Domain, cookie.Secure, cookie.HttpOnly, cookie.SameSite)
}

// GetSessionCookie retrieves the session cookie value
func (h *CookieHelper) GetSessionCookie() string {
	return h.controller.Ctx.GetCookie(SessionCookieName)
}

// ClearSessionCookie removes the session cookie
func (h *CookieHelper) ClearSessionCookie() {
	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     config.DefaultString("auth::cookie_path", "/"),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isSecureContext(),
		SameSite: getSameSiteMode(),
	}

	// Set domain if configured
	if domain := config.DefaultString("auth::cookie_domain", ""); domain != "" {
		cookie.Domain = domain
	}

	h.controller.Ctx.Output.Cookie(cookie.Name, cookie.Value, cookie.MaxAge,
		cookie.Path, cookie.Domain, cookie.Secure, cookie.HttpOnly, cookie.SameSite)
}

// isSecureContext determines if we should use secure cookies
func isSecureContext() bool {
	// Use secure cookies in production or when explicitly configured
	runMode := config.DefaultString("runmode", "dev")
	forceSecure := config.DefaultBool("auth::force_secure_cookies", false)

	return runMode == "prod" || forceSecure
}

// getSameSiteMode returns the configured SameSite mode
func getSameSiteMode() http.SameSite {
	sameSiteStr := config.DefaultString("auth::cookie_samesite", "lax")
	
	switch sameSiteStr {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	case "lax":
		fallthrough
	default:
		return http.SameSiteLaxMode
	}
}
