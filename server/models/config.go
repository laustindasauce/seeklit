package models

// ConfigUpdateRequest represents the structure of the incoming request
type ConfigUpdateRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}
