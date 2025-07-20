package database

import (
	"api/models"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Declare the variable for the database
var DB *gorm.DB

// Connect to sqlite db
func Connect() {
	dbPath := config.DefaultString("db::path", "/data")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		logs.Info("Database directory not found at %s, creating it.\n", dbPath)
		if err := os.MkdirAll(dbPath, 0600); err != nil {
			logs.Error("Failed to create database directory: %v\n", err)
			log.Fatal(err)
		}
		logs.Info("Database directory created at %s\n", dbPath)
	}

	dbLoc := fmt.Sprintf("%s/seeklit.db", dbPath)
	if _, err := os.Stat(dbLoc); os.IsNotExist(err) {
		logs.Info("Database file not found at %s, creating a new one.\n", dbLoc)
		if _, err := os.Create(dbLoc); err != nil {
			logs.Error("Failed to create database file: %v\n", err)
			log.Fatal(err)
		}
		logs.Info("Database file created at %s\n", dbLoc)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbLoc), &gorm.Config{
		Logger: getCustomLogger(),
	})
	if err != nil {
		logs.Error("Error connecting to database: %v", err)
		log.Fatal(err)
	}

	logs.Info("Connection Opened to database.")

	// Migrate the models into DB
	DB.AutoMigrate(&models.BookRequest{}, &models.Issue{}, &models.UserPreferences{})

	logs.Info("Database Migrated")
}

func getCustomLogger() logger.Interface {
	return logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			// SlowThreshold:             time.Second,   // Slow SQL threshold
			LogLevel: getGormLogLevel(config.DefaultString("db::loglevel", "warn")),
			// Don't include params in the SQL log
			ParameterizedQueries: true,
			// Colorful logs
			Colorful: config.DefaultBool("db::logcolorful", true),
		},
	)
}

// Helper function to get GORM log level
func getGormLogLevel(level string) logger.LogLevel {
	switch strings.ToLower(level) {
	case "silent":
		return logger.Silent
	case "error":
		return logger.Error
	case "warn":
		return logger.Warn
	case "info":
		return logger.Info
	default:
		logs.Warn("Invalid db::logLevel: '%s'. Defaulting to 'warn'.\n", level)
		return logger.Warn
	}
}
