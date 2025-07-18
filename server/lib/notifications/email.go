package notifications

import (
	"crypto/tls"
	"fmt"
	"net/smtp"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

func sendEmailNotification(to, subject, body string) error {
	if !config.DefaultBool("smtp::enabled", false) {
		return fmt.Errorf("SMTP is not enabled")
	}

	host := config.DefaultString("smtp::host", "")
	port := config.DefaultString("smtp::port", "587")
	username := config.DefaultString("smtp::username", "")
	password := config.DefaultString("smtp::password", "")
	from := config.DefaultString("smtp::from", "noreply@seeklit.com")
	useTLS := config.DefaultBool("smtp::tls", true)
	skipVerify := config.DefaultBool("smtp::skipverify", false)

	if host == "" || username == "" || password == "" {
		return fmt.Errorf("SMTP configuration incomplete")
	}

	// Create message
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", from, to, subject, body)

	// Setup authentication
	auth := smtp.PlainAuth("", username, password, host)

	// Setup TLS config
	tlsConfig := &tls.Config{
		InsecureSkipVerify: skipVerify,
		ServerName:         host,
	}

	addr := fmt.Sprintf("%s:%s", host, port)

	if useTLS {
		// Connect with TLS
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("failed to connect with TLS: %v", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, host)
		if err != nil {
			return fmt.Errorf("failed to create SMTP client: %v", err)
		}
		defer client.Quit()

		// Authenticate
		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("authentication failed: %v", err)
		}

		// Send email
		if err = client.Mail(from); err != nil {
			return fmt.Errorf("failed to set sender: %v", err)
		}
		if err = client.Rcpt(to); err != nil {
			return fmt.Errorf("failed to set recipient: %v", err)
		}

		writer, err := client.Data()
		if err != nil {
			return fmt.Errorf("failed to get data writer: %v", err)
		}
		defer writer.Close()

		_, err = writer.Write([]byte(msg))
		if err != nil {
			return fmt.Errorf("failed to write message: %v", err)
		}
	} else {
		// Send without TLS (not recommended for production)
		err := smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
		if err != nil {
			return fmt.Errorf("failed to send email: %v", err)
		}
	}

	logs.Info("Email sent successfully to: %s", to)
	return nil
}

// SendRequestCompletionEmail sends notification when a request is marked complete
func SendRequestCompletionEmail(userEmail, requestTitle string) error {
	subject := "Your Seeklit Request is Complete"
	body := fmt.Sprintf(`Hello,

Your request "%s" has been completed and is now available in your Audiobookshelf library.

You can access it through your Audiobookshelf interface.

Best regards,
Seeklit Team`, requestTitle)

	return sendEmailNotification(userEmail, subject, body)
}