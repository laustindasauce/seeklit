package lib

import (
	"api/models"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

// SessionData holds the session information
type SessionData struct {
	ID        string
	Data      map[string]interface{}
	CreatedAt time.Time
	LastUsed  time.Time
}

// AuthSessionData holds authentication-specific session data
type AuthSessionData struct {
	UserID      string                 `json:"user_id"`
	Username    string                 `json:"username"`
	Email       string                 `json:"email"`
	Name        string                 `json:"name"`
	UserType    string                 `json:"user_type"`
	Groups      []string               `json:"groups"`
	Roles       []string               `json:"roles"`
	AuthSource  string                 `json:"auth_source"`
	Permissions models.UserPermissions `json:"permissions"`
	CreatedAt   time.Time              `json:"created_at"`
	LastAccess  time.Time              `json:"last_access"`
	ExpiresAt   time.Time              `json:"expires_at"`
}

// SessionStore manages sessions in memory
type SessionStore struct {
	sessions map[string]*SessionData
	mutex    sync.RWMutex
	maxAge   time.Duration
}

var (
	globalSessionStore *SessionStore
	once               sync.Once
)

// GetSessionStore returns the global session store instance
func GetSessionStore() *SessionStore {
	once.Do(func() {
		// Get session duration from config (default 24 hours)
		sessionDuration := config.DefaultInt("auth::session_duration_hours", 24)
		
		globalSessionStore = &SessionStore{
			sessions: make(map[string]*SessionData),
			maxAge:   time.Duration(sessionDuration) * time.Hour,
		}
		// Start cleanup goroutine
		go globalSessionStore.cleanup()
	})
	return globalSessionStore
}

// GenerateSessionID creates a new random session ID
func GenerateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateSession creates a new session and returns the session ID
func (s *SessionStore) CreateSession() (string, error) {
	sessionID, err := GenerateSessionID()
	if err != nil {
		return "", err
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.sessions[sessionID] = &SessionData{
		ID:        sessionID,
		Data:      make(map[string]interface{}),
		CreatedAt: time.Now(),
		LastUsed:  time.Now(),
	}

	logs.Debug("Created new session: %s", sessionID)
	return sessionID, nil
}

// GetSession retrieves a session by ID
func (s *SessionStore) GetSession(sessionID string) *SessionData {
	if sessionID == "" {
		return nil
	}

	s.mutex.RLock()
	defer s.mutex.RUnlock()

	session, exists := s.sessions[sessionID]
	if !exists {
		return nil
	}

	// Check if session has expired
	if time.Since(session.LastUsed) > s.maxAge {
		// Session expired, remove it
		go func() {
			s.mutex.Lock()
			delete(s.sessions, sessionID)
			s.mutex.Unlock()
			logs.Debug("Expired session removed: %s", sessionID)
		}()
		return nil
	}

	// Update last used time
	session.LastUsed = time.Now()
	return session
}

// SetSessionValue sets a value in the session
func (s *SessionStore) SetSessionValue(sessionID, key string, value interface{}) error {
	session := s.GetSession(sessionID)
	if session == nil {
		return ErrSessionNotFound
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	session.Data[key] = value
	session.LastUsed = time.Now()
	
	logs.Debug("Set session value - ID: %s, Key: %s", sessionID, key)
	return nil
}

// GetSessionValue gets a value from the session
func (s *SessionStore) GetSessionValue(sessionID, key string) (interface{}, bool) {
	session := s.GetSession(sessionID)
	if session == nil {
		return nil, false
	}

	s.mutex.RLock()
	defer s.mutex.RUnlock()

	value, exists := session.Data[key]
	logs.Debug("Get session value - ID: %s, Key: %s, Found: %v", sessionID, key, exists)
	return value, exists
}

// DeleteSessionValue removes a value from the session
func (s *SessionStore) DeleteSessionValue(sessionID, key string) error {
	session := s.GetSession(sessionID)
	if session == nil {
		return ErrSessionNotFound
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	delete(session.Data, key)
	session.LastUsed = time.Now()
	
	logs.Debug("Deleted session value - ID: %s, Key: %s", sessionID, key)
	return nil
}

// DestroySession removes a session completely
func (s *SessionStore) DestroySession(sessionID string) {
	if sessionID == "" {
		return
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	delete(s.sessions, sessionID)
	logs.Debug("Destroyed session: %s", sessionID)
}

// cleanup removes expired sessions periodically
func (s *SessionStore) cleanup() {
	// Get cleanup interval from config (default 180 minutes = 3 hours)
	cleanupInterval := config.DefaultInt("auth::session_cleanup_interval", 180)
	ticker := time.NewTicker(time.Duration(cleanupInterval) * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.cleanupExpiredSessions()
	}
}

// cleanupExpiredSessions removes all expired sessions
func (s *SessionStore) cleanupExpiredSessions() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	now := time.Now()
	expiredCount := 0

	for sessionID, session := range s.sessions {
		expired := false
		
		// Check general session expiry
		if now.Sub(session.LastUsed) > s.maxAge {
			expired = true
		}
		
		// Check auth session specific expiry
		if authData, exists := session.Data["auth"]; exists {
			if authSessionData, ok := authData.(*AuthSessionData); ok {
				if now.After(authSessionData.ExpiresAt) {
					expired = true
				}
			}
		}
		
		if expired {
			delete(s.sessions, sessionID)
			expiredCount++
		}
	}

	if expiredCount > 0 {
		logs.Debug("Cleaned up %d expired sessions", expiredCount)
	}
}

// GetSessionCount returns the number of active sessions
func (s *SessionStore) GetSessionCount() int {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return len(s.sessions)
}

// CreateAuthSession creates a new authentication session and returns the session token
func (s *SessionStore) CreateAuthSession(userID, username, email, name, userType string, 
	groups, roles []string, authSource string, permissions models.UserPermissions) (string, error) {
	
	token, err := GenerateSessionID()
	if err != nil {
		return "", err
	}

	// Get session duration from config (default 24 hours)
	sessionDuration := config.DefaultInt("auth::session_duration_hours", 24)
	
	authData := &AuthSessionData{
		UserID:      userID,
		Username:    username,
		Email:       email,
		Name:        name,
		UserType:    userType,
		Groups:      groups,
		Roles:       roles,
		AuthSource:  authSource,
		Permissions: permissions,
		CreatedAt:   time.Now(),
		LastAccess:  time.Now(),
		ExpiresAt:   time.Now().Add(time.Duration(sessionDuration) * time.Hour),
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.sessions[token] = &SessionData{
		ID:        token,
		Data:      map[string]interface{}{"auth": authData},
		CreatedAt: time.Now(),
		LastUsed:  time.Now(),
	}

	logs.Debug("Created auth session for user %s (type: %s, source: %s), expires at: %v", 
		username, userType, authSource, authData.ExpiresAt)

	return token, nil
}

// GetAuthSession retrieves authentication session data by token
func (s *SessionStore) GetAuthSession(token string) (*AuthSessionData, bool) {
	session := s.GetSession(token)
	if session == nil {
		return nil, false
	}

	authData, exists := session.Data["auth"]
	if !exists {
		return nil, false
	}

	authSessionData, ok := authData.(*AuthSessionData)
	if !ok {
		return nil, false
	}

	// Check if auth session is expired (separate from general session expiry)
	if time.Now().After(authSessionData.ExpiresAt) {
		s.DestroySession(token)
		return nil, false
	}

	// Update last access time
	s.mutex.Lock()
	authSessionData.LastAccess = time.Now()
	s.mutex.Unlock()

	return authSessionData, true
}

// GetUserFromAuthSession converts auth session data to User model
func (s *SessionStore) GetUserFromAuthSession(authData *AuthSessionData) *models.User {
	return &models.User{
		ID:          authData.UserID,
		Username:    authData.Username,
		Type:        authData.UserType,
		Token:       "", // We don't store the session token in the user object
		IsActive:    true,
		IsLocked:    false,
		LastSeen:    int(authData.LastAccess.Unix()),
		CreatedAt:   int(authData.CreatedAt.Unix()),
		Permissions: authData.Permissions,
	}
}

// RefreshAuthSession extends the auth session expiration
func (s *SessionStore) RefreshAuthSession(token string) bool {
	session := s.GetSession(token)
	if session == nil {
		return false
	}

	authData, exists := session.Data["auth"]
	if !exists {
		return false
	}

	authSessionData, ok := authData.(*AuthSessionData)
	if !ok {
		return false
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if session is expired
	if time.Now().After(authSessionData.ExpiresAt) {
		delete(s.sessions, token)
		return false
	}

	// Extend expiration
	sessionDuration := config.DefaultInt("auth::session_duration_hours", 24)
	authSessionData.ExpiresAt = time.Now().Add(time.Duration(sessionDuration) * time.Hour)
	authSessionData.LastAccess = time.Now()

	return true
}

// Custom errors
var (
	ErrSessionNotFound = &SessionError{"session not found"}
)

type SessionError struct {
	message string
}

func (e *SessionError) Error() string {
	return e.message
}