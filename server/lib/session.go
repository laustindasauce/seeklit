package lib

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"github.com/beego/beego/v2/core/logs"
)

// SessionData holds the session information
type SessionData struct {
	ID        string
	Data      map[string]interface{}
	CreatedAt time.Time
	LastUsed  time.Time
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
		globalSessionStore = &SessionStore{
			sessions: make(map[string]*SessionData),
			maxAge:   time.Hour, // Default 1 hour session timeout
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
	ticker := time.NewTicker(10 * time.Minute) // Cleanup every 10 minutes
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.cleanupExpiredSessions()
		}
	}
}

// cleanupExpiredSessions removes all expired sessions
func (s *SessionStore) cleanupExpiredSessions() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	now := time.Now()
	expiredCount := 0

	for sessionID, session := range s.sessions {
		if now.Sub(session.LastUsed) > s.maxAge {
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