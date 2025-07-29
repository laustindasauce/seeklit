package helpers

import (
	"fmt"
	"net/url"
	"os"
	"strings"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
)

// ValidateConfig checks for misconfigured settings and logs warnings/errors
func ValidateConfig() error {
	var errors []string
	var warnings []string

	// Validate metadata provider
	if err := validateMetadataProvider(&warnings); err != nil {
		errors = append(errors, err.Error())
	}

	// Validate authentication configuration
	if err := validateAuthConfig(&warnings); err != nil {
		errors = append(errors, err.Error())
	}

	// Validate OIDC configuration if enabled
	if err := validateOIDCConfig(&warnings); err != nil {
		errors = append(errors, err.Error())
	}

	// Validate database configuration
	if err := validateDatabaseConfig(&warnings); err != nil {
		errors = append(errors, err.Error())
	}

	// Validate SMTP configuration if enabled
	if err := validateSMTPConfig(&warnings); err != nil {
		errors = append(errors, err.Error())
	}

	// Log all warnings
	for _, warning := range warnings {
		logs.Warn("Config validation warning: %s", warning)
	}

	// If there are critical errors, return them
	if len(errors) > 0 {
		return fmt.Errorf("config validation failed: %s", strings.Join(errors, "; "))
	}

	logs.Info("Configuration validation completed successfully")
	return nil
}

// validateMetadataProvider checks if the metadata provider is valid
func validateMetadataProvider(warnings *[]string) error {
	provider := config.DefaultString("metadata::provider", "OPENLIBRARY")
	validProviders := []string{"GOOGLE", "OPENLIBRARY", "HARDCOVER"}

	// Check if provider is valid
	isValid := false
	for _, valid := range validProviders {
		if strings.ToUpper(provider) == valid {
			isValid = true
			break
		}
	}

	if !isValid {
		return fmt.Errorf("invalid metadata provider '%s'. Valid options are: %s", 
			provider, strings.Join(validProviders, ", "))
	}

	// Check for required API keys based on provider
	switch strings.ToUpper(provider) {
	case "GOOGLE":
		apiKey := config.DefaultString("metadata::googleapikey", "")
		if apiKey == "" {
			*warnings = append(*warnings, "Google API key is not configured for GOOGLE metadata provider")
		}
	case "HARDCOVER":
		token := config.DefaultString("metadata::hardcoverbearertoken", "")
		if token == "" {
			*warnings = append(*warnings, "Hardcover bearer token is not configured for HARDCOVER metadata provider")
		}
	}

	return nil
}

// validateAuthConfig checks authentication configuration
func validateAuthConfig(warnings *[]string) error {
	method := config.DefaultString("auth::method", "oidc")
	
	if strings.ToLower(method) != "oidc" {
		return fmt.Errorf("invalid authentication method '%s'. Only 'oidc' is supported", method)
	}

	return nil
}

// validateOIDCConfig checks OIDC configuration
func validateOIDCConfig(warnings *[]string) error {
	// Check required OIDC fields
	issuer := config.DefaultString("oidc::issuer", "")
	clientID := config.DefaultString("oidc::clientid", "")
	clientSecret := config.DefaultString("oidc::clientsecret", "")
	redirectURL := config.DefaultString("oidc::redirecturl", "")

	var missingFields []string

	if issuer == "" {
		missingFields = append(missingFields, "oidc::issuer")
	} else {
		// Validate issuer URL format
		if _, err := url.Parse(issuer); err != nil {
			*warnings = append(*warnings, fmt.Sprintf("OIDC issuer URL may be invalid: %s", issuer))
		}
	}

	if clientID == "" {
		missingFields = append(missingFields, "oidc::clientid")
	}

	if clientSecret == "" {
		missingFields = append(missingFields, "oidc::clientsecret")
	}

	if redirectURL == "" {
		missingFields = append(missingFields, "oidc::redirecturl")
	} else {
		// Validate redirect URL format
		if _, err := url.Parse(redirectURL); err != nil {
			*warnings = append(*warnings, fmt.Sprintf("OIDC redirect URL may be invalid: %s", redirectURL))
		}
	}

	if len(missingFields) > 0 {
		return fmt.Errorf("missing required OIDC configuration fields: %s", strings.Join(missingFields, ", "))
	}

	return nil
}

// validateDatabaseConfig checks database configuration
func validateDatabaseConfig(warnings *[]string) error {
	dbPath := config.DefaultString("db::path", "/data")
	
	// Check if database path exists or can be created
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		*warnings = append(*warnings, fmt.Sprintf("Database path '%s' does not exist. It will be created if possible", dbPath))
	}

	// Validate approval status
	approvalStatus := config.DefaultString("db::defaultaprrovalstatus", "pending")
	validStatuses := []string{"pending", "approved"}
	
	isValid := false
	for _, valid := range validStatuses {
		if strings.ToLower(approvalStatus) == valid {
			isValid = true
			break
		}
	}

	if !isValid {
		return fmt.Errorf("invalid default approval status '%s'. Valid options are: %s", 
			approvalStatus, strings.Join(validStatuses, ", "))
	}

	return nil
}

// validateSMTPConfig checks SMTP configuration if enabled
func validateSMTPConfig(warnings *[]string) error {
	enabled := config.DefaultBool("smtp::enabled", false)
	
	if !enabled {
		return nil
	}

	// Check required SMTP fields when enabled
	host := config.DefaultString("smtp::host", "")
	port := config.DefaultInt("smtp::port", 587)
	username := config.DefaultString("smtp::username", "")
	password := config.DefaultString("smtp::password", "")
	from := config.DefaultString("smtp::from", "")

	var missingFields []string

	if host == "" {
		missingFields = append(missingFields, "smtp::host")
	}

	if port <= 0 || port > 65535 {
		*warnings = append(*warnings, fmt.Sprintf("SMTP port %d may be invalid", port))
	}

	if username == "" {
		missingFields = append(missingFields, "smtp::username")
	}

	if password == "" {
		missingFields = append(missingFields, "smtp::password")
	}

	if from == "" {
		missingFields = append(missingFields, "smtp::from")
	}

	if len(missingFields) > 0 {
		return fmt.Errorf("SMTP is enabled but missing required fields: %s", strings.Join(missingFields, ", "))
	}

	return nil
}