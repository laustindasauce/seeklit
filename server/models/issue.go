package models

import (
	"time"

	"gorm.io/gorm"
)

type Issue struct {
	ID              uint      `json:"id" gorm:"primarykey"`
	BookID          string    `json:"book_id" gorm:"size:50;not null"`
	BookTitle       string    `json:"book_title" gorm:"not null"`
	Description     string    `json:"description" gorm:"not null"`
	Severity        string    `json:"severity" gorm:"size:50;not null"`
	Status          string    `json:"status" gorm:"size:50;not null"`
	CreatorID       string    `json:"creator_id" gorm:"size:50;not null"`
	CreatorUsername string    `json:"creator_username" gorm:"size:100;not null"`
	UpdatedAt       time.Time `json:"updated_at"`
	CreatedAt       time.Time `json:"created_at"`
}

type IssueUpdate struct {
	Status *string `json:"status"`
}

type IssueRepository interface {
	CreateIssue(issue *Issue) (*Issue, error)
	GetIssues() ([]Issue, error)
	GetIssue(id string) (*Issue, error)
	UpdateIssue(Issue *Issue, updateIssue IssueUpdate) (*Issue, error)
	DeleteIssue(Issue *Issue) error
}

type issueRepository struct {
	db *gorm.DB
}

func NewIssueRepository(db *gorm.DB) IssueRepository {
	return &issueRepository{db: db}
}

func (r *issueRepository) CreateIssue(issue *Issue) (*Issue, error) {
	if err := r.db.Create(issue).Error; err != nil {
		return nil, err
	}
	return issue, nil
}

func (r *issueRepository) GetIssues() ([]Issue, error) {
	var Issue []Issue

	if err := r.db.Find(&Issue).Error; err != nil {
		return Issue, err
	}

	return Issue, nil
}

func (r *issueRepository) GetIssue(id string) (*Issue, error) {
	var issue Issue
	if err := r.db.Model(Issue{}).First(&issue, id).Error; err != nil {
		return nil, err
	}
	return &issue, nil
}

func (r *issueRepository) UpdateIssue(issue *Issue, updateIssue IssueUpdate) (*Issue, error) {
	// Edit the issue
	if updateIssue.Status != nil {
		issue.Status = *updateIssue.Status
	}

	// Save the changes
	if err := r.db.Save(issue).Error; err != nil {
		return nil, err
	}

	// Return the updated issue
	return issue, nil
}

func (r *issueRepository) DeleteIssue(Issue *Issue) error {
	return r.db.Unscoped().Delete(&Issue, Issue.ID).Error
}
