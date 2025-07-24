package helpers

import (
	"api/lib"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
)

const (
	SessionCookieName = "session_id"
)

// SessionHelper provides session functionality for Beego controllers
type SessionHelper struct {
	controller *beego.Controller
	sessionID  string
	store      *lib.SessionStore
}

// NewSessionHelper creates a new session helper for a controller
func NewSessionHelper(controller *beego.Controller) *SessionHelper {
	return &SessionHelper{
		controller: controller,
		store:      lib.GetSessionStore(),
	}
}

// getSessionID retrieves the session ID from cookie or creates a new one
func (h *SessionHelper) getSessionID() string {
	if h.sessionID != "" {
		return h.sessionID
	}

	// Try to get session ID from cookie
	sessionCookieName := config.DefaultString("sessionname", "seeklit_session")
	sessionID := h.controller.Ctx.GetCookie(sessionCookieName)

	if sessionID != "" {
		// Verify session exists
		session := h.store.GetSession(sessionID)
		if session != nil {
			h.sessionID = sessionID
			logs.Debug("Found existing session: %s", sessionID)
			return sessionID
		}
		logs.Debug("Session cookie found but session doesn't exist: %s", sessionID)
	}

	// Create new session
	newSessionID, err := h.store.CreateSession()
	if err != nil {
		logs.Error("Failed to create session: %v", err)
		return ""
	}

	// Set session cookie
	h.controller.Ctx.SetCookie(sessionCookieName, newSessionID, 3600, "/", "", false, true)
	h.sessionID = newSessionID

	logs.Debug("Created new session: %s", newSessionID)
	return newSessionID
}

// Set stores a value in the session
func (h *SessionHelper) Set(key string, value interface{}) error {
	sessionID := h.getSessionID()
	if sessionID == "" {
		return lib.ErrSessionNotFound
	}

	return h.store.SetSessionValue(sessionID, key, value)
}

// Get retrieves a value from the session
func (h *SessionHelper) Get(key string) (interface{}, bool) {
	sessionID := h.getSessionID()
	if sessionID == "" {
		return nil, false
	}

	return h.store.GetSessionValue(sessionID, key)
}

// Delete removes a value from the session
func (h *SessionHelper) Delete(key string) error {
	sessionID := h.getSessionID()
	if sessionID == "" {
		return lib.ErrSessionNotFound
	}

	return h.store.DeleteSessionValue(sessionID, key)
}

// Destroy completely removes the session
func (h *SessionHelper) Destroy() {
	sessionID := h.getSessionID()
	if sessionID == "" {
		return
	}

	// Remove session from store
	h.store.DestroySession(sessionID)

	// Clear session cookie
	sessionCookieName := config.DefaultString("sessionname", "seeklit_session")
	h.controller.Ctx.SetCookie(sessionCookieName, "", -1, "/", "", false, true)

	h.sessionID = ""
}

// GetSessionID returns the current session ID
func (h *SessionHelper) GetSessionID() string {
	return h.getSessionID()
}

// Exists checks if a key exists in the session
func (h *SessionHelper) Exists(key string) bool {
	_, exists := h.Get(key)
	return exists
}
