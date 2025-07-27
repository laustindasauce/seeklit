package controllers

import (
	"api/helpers"
	"api/middlewares"
	"api/models"
	"encoding/json"

	"github.com/beego/beego/v2/core/config"
	beego "github.com/beego/beego/v2/server/web"
)

// Operations about config
type ConfigController struct {
	beego.Controller
}

// @Title GetSettings
// @Description retrieve public settings for api
// @Success 200 {object} map[string]any
// @router / [get]
func (s *ConfigController) Get() {
	sections := []string{
		"default", "general", "db", "metadata", "notify",
		"download", "smtp", "auth", "oidc",
	}

	// Get the current user from context
	user := middlewares.GetUser(s.Ctx)
	isAdmin := user != nil && (user.Type == "admin" || user.Type == "root")

	// Define allowed keys for non-admin users (whitelist approach)
	allowedKeysForNonAdmin := map[string][]string{
		"metadata": {"provider"},
		"smtp":     {"enabled"},
		"auth":     {"method"},
	}

	// Create a map to hold the configuration options
	configMap := make(map[string]map[string]string)

	// Iterate over sections and populate the map
	for _, section := range sections {
		values, err := config.GetSection(section)
		if err != nil {
			configMap[section] = map[string]string{"error": "Section not found or empty"}
			continue
		}

		// If user is admin, return all values; otherwise only return whitelisted keys
		if isAdmin {
			configMap[section] = values
		} else {
			// Only include whitelisted keys for non-admin users
			filteredValues := make(map[string]string)
			if allowedKeys, exists := allowedKeysForNonAdmin[section]; exists {
				for _, allowedKey := range allowedKeys {
					if value, keyExists := values[allowedKey]; keyExists {
						filteredValues[allowedKey] = value
					}
				}
			}
			// Only add section to response if it has allowed keys
			if len(filteredValues) > 0 {
				configMap[section] = filteredValues
			}
		}
	}

	// Return the configuration as JSON
	s.Data["json"] = configMap
	s.ServeJSON()
}

// @Title UpdateConfig
// @Description create issue
// @Param	body		body 	models.ConfigUpdateRequest	true		"body for updated config"
// @Success 200 {object} map[string]any
// @Failure 403 body is empty
// @router / [patch]
func (c *ConfigController) UpdateConfig() {
	// Check if user is admin
	user := middlewares.GetUser(c.Ctx)
	if user == nil || (!user.IsAdmin()) {
		c.Ctx.Output.SetStatus(403)
		c.Data["json"] = map[string]string{"error": "Admin access required"}
		c.ServeJSON()
		return
	}

	// Parse the JSON body
	var req models.ConfigUpdateRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &req); err != nil {
		c.Data["json"] = map[string]string{"error": "Invalid JSON payload"}
		c.ServeJSON()
		return
	}

	// Update the configuration
	if err := config.Set(req.Key, req.Value); err != nil {
		c.Data["json"] = map[string]string{"error": "Failed to update configuration"}
		c.ServeJSON()
		return
	}

	// Save the configuration back to the file
	if err := config.SaveConfigFile(helpers.GetEnv("SEEKLIT_CONF_FILE", "/config/seeklit.conf")); err != nil {
		c.Data["json"] = map[string]string{"error": "Failed to save configuration"}
		c.ServeJSON()
		return
	}

	// Return success
	c.Data["json"] = map[string]string{"message": "Configuration updated successfully"}
	c.ServeJSON()
}
