package helpers

import (
	"os"
	"strconv"
)

// Get environment variable with an optional default
func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// GetBoolEnv retrieves a boolean environment variable by key.
// If the variable is not set or cannot be parsed as a boolean, it returns the provided default value.
func GetBoolEnv(key string, defaultValue bool) bool {
	val, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}

	parsedVal, err := strconv.ParseBool(val)
	if err != nil {
		return defaultValue
	}

	return parsedVal
}

// GetIntEnv retrieves an integer environment variable by key.
// If the variable is not set or cannot be parsed as an integer, it returns the provided default value.
func GetIntEnv(key string, defaultValue int) int {
	val, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}

	parsedVal, err := strconv.Atoi(val)
	if err != nil {
		return defaultValue
	}

	return parsedVal
}
