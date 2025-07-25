package models

import (
	"time"
)

type UserPreferences struct {
	ID                    uint      `json:"id" gorm:"primaryKey"`
	UserID                string    `json:"userId" gorm:"uniqueIndex;size:255"` // Audiobookshelf user ID
	Email                 string    `json:"email" gorm:"size:255"`
	NotificationsEnabled  bool      `json:"notificationsEnabled" gorm:"default:false"`
	EmailVerified         bool      `json:"emailVerified" gorm:"default:false"`
	EmailVerificationCode string    `json:"-" gorm:"size:255"` // Hidden from JSON
	Theme                 string    `json:"theme" gorm:"size:20;default:'system'"` // Theme preference: light, dark, system
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}