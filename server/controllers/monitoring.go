package controllers

import (
	"api/helpers"

	"github.com/beego/beego/v2/core/config"
	beego "github.com/beego/beego/v2/server/web"
)

// Operations about monitoring
type MonitoringController struct {
	beego.Controller
}

// @Title GetSettings
// @Description retrieve public settings for api
// @Success 200 {object} map[string]any
// @router / [get]
func (m *MonitoringController) Get() {
	m.Data["json"] = map[string]any{
		"metadata_provider": config.DefaultString("metadata::provider", "OPENLIBRARY"),
		"version":           helpers.GetEnv("SEEKLIT_VERSION", "develop"),
	}
	m.ServeJSON()
}
