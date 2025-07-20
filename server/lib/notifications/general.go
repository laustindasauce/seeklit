package notifications

import (
	"api/database"
	"api/models"
	"errors"
	"fmt"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	"gorm.io/gorm"
)

func SendAdminNotification(title, body string) {
	appriseService := config.DefaultString("notify::appriseadminservice", "")
	if config.DefaultBool("notify::enabled", false) && appriseService != "" {
		err := sendAppriseNotification(appriseService, title, body)
		if err != nil {
			logs.Warn("Unable to send notification: %v\n", err)
			logs.Info(title + "\n" + body)
		}
	}
}

// SendUserNotificationEmail sends email notification to a specific user
func SendUserNotificationEmail(userEmail, title, body string) error {
	if config.DefaultBool("smtp::enabled", false) {
		err := sendEmailNotification(userEmail, title, body)
		if err != nil {
			logs.Warn("Unable to send email notification: %v\n", err)
			return err
		}
	} else {
		return errors.New("SMTP is disabled. Email not getting sent.")
	}

	return nil
}

func SendErrorNotification(location, info string, err error) {
	appriseService := config.DefaultString("notify::appriseadminservice", "")
	title := "⛔☢️⛔ Seeklit application caught an error!"
	body := fmt.Sprintf("Location: %s\nInfo: %s\nError: %v", location, info, err)

	if config.DefaultBool("notify::enabled", false) && appriseService != "" {
		err := sendAppriseNotification(appriseService, title, body)
		if err != nil {
			logs.Warn("Unable to send notification: %v\n", err)
			logs.Warn(title + "\n" + body)
		}
	}
}

// SendUserNotificationIfEnabled sends email notification to a user if they have notifications enabled
func SendUserNotificationIfEnabled(userID, title, body string) {
	if !config.DefaultBool("smtp::enabled", false) {
		logs.Debug("SMTP not enabled, skipping user notification")
		return
	}

	// Get user preferences
	prefs := &models.UserPreferences{}
	err := database.DB.Where("user_id = ?", userID).First(prefs).Error
	if err == gorm.ErrRecordNotFound {
		logs.Debug("No preferences found for user %s, skipping notification", userID)
		return
	} else if err != nil {
		logs.Warn("Failed to get user preferences for %s: %v", userID, err)
		return
	}

	// Check if notifications are enabled and email is verified
	if !prefs.NotificationsEnabled {
		logs.Debug("Notifications disabled for user %s, skipping notification", userID)
		return
	}

	if !prefs.EmailVerified || prefs.Email == "" {
		logs.Debug("Email not verified or empty for user %s, skipping notification", userID)
		return
	}

	// Send the notification
	err = sendEmailNotification(prefs.Email, title, body)
	if err != nil {
		logs.Warn("Failed to send email notification to user %s: %v", userID, err)
	} else {
		logs.Info("Email notification sent to user %s (%s): %s", userID, prefs.Email, title)
	}
}

// SendBookRequestStatusNotification sends notification when book request status changes
func SendBookRequestStatusNotification(request *models.BookRequest, statusType string) {
	var title, body string

	switch statusType {
	case "approved":
		title = "📚 Your Book Request Was Approved!"
		body = fmt.Sprintf(`Hello,

Your book request for "%s" by %s has been approved and is now being processed.

Request ID: #%d
Status: Approved

You'll receive another notification when your book is ready for download.

Beep Boop,
Seeklit Automated Alerts`, request.Title, request.Author, request.ID)

	case "denied":
		title = "❌ Your Book Request Was Denied"
		body = fmt.Sprintf(`Hello,

Unfortunately, your book request for "%s" by %s has been denied.

Request ID: #%d
Status: Denied

If you have questions about this decision, please contact the administrator.

Beep Boop,
Seeklit Automated Alerts`, request.Title, request.Author, request.ID)

	case "completed":
		title = "🎉 Your Book Request is Complete!"
		body = fmt.Sprintf(`Hello,

Great news! Your book request for "%s" by %s has been completed and is now available in your library.

Request ID: #%d
Status: Complete

You can access it through your Audiobookshelf interface.

Beep Boop,
Seeklit Automated Alerts`, request.Title, request.Author, request.ID)

	case "failed":
		title = "⚠️ Your Book Request Failed"
		body = fmt.Sprintf(`Hello,

We encountered an issue processing your book request for "%s" by %s.

Request ID: #%d
Status: Failed

The administrator has been notified and will look into this issue.

Beep Boop,
Seeklit Automated Alerts`, request.Title, request.Author, request.ID)

	default:
		logs.Debug("Unknown status type for book request notification: %s", statusType)
		return
	}

	SendUserNotificationIfEnabled(request.RequestorID, title, body)
}

// SendIssueStatusNotification sends notification when issue status changes
func SendIssueStatusNotification(issue *models.Issue, statusType string) {
	var title, body string

	switch statusType {
	case "resolved":
		title = "✅ Your Issue Has Been Resolved"
		body = fmt.Sprintf(`Hello,

Your issue regarding "%s" has been resolved.

Issue ID: #%d
Status: Resolved
Description: %s

If you continue to experience problems, please feel free to submit a new issue.

Beep Boop,
Seeklit Automated Alerts`, issue.BookTitle, issue.ID, issue.Description)

	case "cancelled":
		title = "❌ Your Issue Was Cancelled"
		body = fmt.Sprintf(`Hello,

Your issue regarding "%s" has been cancelled.

Issue ID: #%d
Status: Cancelled
Description: %s

If you believe this was done in error, please contact the administrator.

Beep Boop,
Seeklit Automated Alerts`, issue.BookTitle, issue.ID, issue.Description)

	default:
		logs.Debug("Unknown status type for issue notification: %s", statusType)
		return
	}

	SendUserNotificationIfEnabled(issue.CreatorID, title, body)
}
