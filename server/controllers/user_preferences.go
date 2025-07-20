package controllers

import (
	"api/database"
	"api/lib/notifications"
	"api/middlewares"
	"api/models"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
	"gorm.io/gorm"
)

// UserPreferencesController handles user notification preferences
type UserPreferencesController struct {
	beego.Controller
}

// @Title Get User Preferences
// @Description Get current user's notification preferences
// @Success 200 {object} models.UserPreferences
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router / [get]
func (c *UserPreferencesController) Get() {
	user := middlewares.GetUser(c.Ctx)
	if user == nil {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "unauthorized"}
		c.ServeJSON()
		return
	}

	prefs := &models.UserPreferences{}

	err := database.DB.Where("user_id = ?", user.ID).First(prefs).Error
	if err == gorm.ErrRecordNotFound {
		// Create default preferences if none exist
		prefs = &models.UserPreferences{
			UserID:               user.ID,
			NotificationsEnabled: false,
			EmailVerified:        false,
		}
		err = database.DB.Create(prefs).Error
		if err != nil {
			logs.Error("Failed to create user preferences: %v", err)
			c.Ctx.Output.SetStatus(http.StatusInternalServerError)
			c.Data["json"] = map[string]string{"error": "failed to create preferences"}
			c.ServeJSON()
			return
		}
	} else if err != nil {
		logs.Error("Failed to get user preferences: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "failed to get preferences"}
		c.ServeJSON()
		return
	}

	c.Data["json"] = prefs
	c.ServeJSON()
}

// @Title Update User Preferences
// @Description Update current user's notification preferences
// @Param body body models.UserPreferences true "User preferences"
// @Success 200 {object} models.UserPreferences
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router / [put]
func (c *UserPreferencesController) Put() {
	user := middlewares.GetUser(c.Ctx)
	if user == nil {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "unauthorized"}
		c.ServeJSON()
		return
	}

	var updateData struct {
		Email                string `json:"email"`
		NotificationsEnabled bool   `json:"notificationsEnabled"`
	}

	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &updateData); err != nil {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "invalid request body"}
		c.ServeJSON()
		return
	}

	prefs := &models.UserPreferences{}

	err := database.DB.Where("user_id = ?", user.ID).First(prefs).Error
	if err == gorm.ErrRecordNotFound {
		// Create new preferences
		prefs = &models.UserPreferences{
			UserID:               user.ID,
			Email:                updateData.Email,
			NotificationsEnabled: updateData.NotificationsEnabled,
			EmailVerified:        false,
		}
		err = database.DB.Create(prefs).Error
	} else if err == nil {
		// Update existing preferences
		emailChanged := prefs.Email != updateData.Email
		prefs.Email = updateData.Email
		prefs.NotificationsEnabled = updateData.NotificationsEnabled

		// Reset email verification if email changed
		if emailChanged && updateData.Email != "" {
			prefs.EmailVerified = false
			prefs.EmailVerificationCode = generateVerificationCode()
		}

		err = database.DB.Save(prefs).Error
	}

	if err != nil {
		logs.Error("Failed to update user preferences: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "failed to update preferences"}
		c.ServeJSON()
		return
	}

	c.Data["json"] = prefs
	c.ServeJSON()
}

// @Title Send Email Verification
// @Description Send verification email to user's email address
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router /verify-email [post]
func (c *UserPreferencesController) SendVerificationEmail() {
	user := middlewares.GetUser(c.Ctx)
	if user == nil {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "unauthorized"}
		c.ServeJSON()
		return
	}

	prefs := &models.UserPreferences{}
	err := database.DB.Where("user_id = ?", user.ID).First(prefs).Error
	if err != nil {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "no email address set"}
		c.ServeJSON()
		return
	}

	if prefs.Email == "" {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "no email address set"}
		c.ServeJSON()
		return
	}

	// Generate new verification code
	prefs.EmailVerificationCode = generateVerificationCode()
	err = database.DB.Save(prefs).Error
	if err != nil {
		logs.Error("Failed to update verification code: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "failed to generate verification code"}
		c.ServeJSON()
		return
	}

	verificationBody := fmt.Sprintf("Hello %s,\n\nPlease verify your email address by using the following code: %s\n\nThis code will expire after 24 hours.\n\nThank you!",
		user.Username,
		prefs.EmailVerificationCode,
	)

	emailErr := notifications.SendUserNotificationEmail(prefs.Email, "Seeklit Verification Email", verificationBody)
	if emailErr != nil {
		logs.Error("Failed to send email notification: %v", emailErr)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "failed to send email notification"}
		c.ServeJSON()
		return
	}

	// For now, we'll just log the verification code (remove this in production!)
	logs.Info("Email verification code for user %s (%s): %s", user.Username, prefs.Email, prefs.EmailVerificationCode)

	c.Data["json"] = map[string]string{"message": "verification email sent"}
	c.ServeJSON()
}

// @Title Verify Email
// @Description Verify user's email address with verification code
// @Param code query string true "Verification code"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @router /verify-email [get]
func (c *UserPreferencesController) VerifyEmail() {
	user := middlewares.GetUser(c.Ctx)
	if user == nil {
		c.Ctx.Output.SetStatus(http.StatusUnauthorized)
		c.Data["json"] = map[string]string{"error": "unauthorized"}
		c.ServeJSON()
		return
	}

	code := c.GetString("code")
	if code == "" {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "verification code required"}
		c.ServeJSON()
		return
	}

	prefs := &models.UserPreferences{}
	err := database.DB.Where("user_id = ? AND email_verification_code = ?", user.ID, code).First(prefs).Error
	if err != nil {
		c.Ctx.Output.SetStatus(http.StatusBadRequest)
		c.Data["json"] = map[string]string{"error": "invalid verification code"}
		c.ServeJSON()
		return
	}

	// Mark email as verified and clear verification code
	prefs.EmailVerified = true
	prefs.EmailVerificationCode = ""
	err = database.DB.Save(prefs).Error
	if err != nil {
		logs.Error("Failed to verify email: %v", err)
		c.Ctx.Output.SetStatus(http.StatusInternalServerError)
		c.Data["json"] = map[string]string{"error": "failed to verify email"}
		c.ServeJSON()
		return
	}

	c.Data["json"] = map[string]string{"message": "email verified successfully"}
	c.ServeJSON()
}

func generateVerificationCode() string {
	// Generate a 6-digit verification code
	return fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
}
