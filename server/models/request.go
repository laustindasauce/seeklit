package models

import (
	"time"

	"github.com/beego/beego/v2/core/config"
	"gorm.io/gorm"
)

type ApprovalStatus string
type DownloadStatus string

const (
	ASPending  ApprovalStatus = "pending"
	ASApproved ApprovalStatus = "approved"
	ASDenied   ApprovalStatus = "denied"

	DSPending   DownloadStatus = "pending"
	DSCancelled DownloadStatus = "cancelled"
	DSFailure   DownloadStatus = "failure"
	DSComplete  DownloadStatus = "complete"
)

type BookRequest struct {
	ID                uint           `json:"id" gorm:"primarykey"`
	Title             string         `json:"title" gorm:"not null"`
	Author            string         `json:"author" gorm:"not null"`
	Source            string         `json:"source" gorm:"size:50;not null"`
	SourceID          string         `json:"source_id" gorm:"size:100;not null"`
	ISBN10            *string        `json:"isbn_10" gorm:"size:10"`
	ISBN13            *string        `json:"isbn_13" gorm:"size:13"`
	Cover             *string        `json:"cover" gorm:"size:500"`
	ApprovalStatus    ApprovalStatus `json:"approval_status" gorm:"size:50;not null;default:pending"`
	DownloadStatus    DownloadStatus `json:"download_status" gorm:"size:50;not null;default:pending"`
	DownloadSource    *string        `json:"download_source" gorm:"size:50"`
	RequestorID       string         `json:"requestor_id" gorm:"size:50;not null"`
	RequestorUsername string         `json:"requestor_username" gorm:"size:100;not null"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

func (b *BookRequest) BeforeCreate(tx *gorm.DB) (err error) {
	// Set default approval status from config
	b.ApprovalStatus = ApprovalStatus(config.DefaultString(
		"db::defaultaprrovalstatus", string(ASPending)))

	return
}

type BookRequestUpdate struct {
	ApprovalStatus *ApprovalStatus `json:"approval_status"`
	DownloadStatus *DownloadStatus `json:"download_status"`
	DownloadSource *string         `json:"download_source"`
}

type RequestRepository interface {
	CreateBookRequest(request *BookRequest) (*BookRequest, error)
	GetBookRequests(limit, offset int, requestorID *string) ([]BookRequest, error)
	GetAllBookRequests() ([]BookRequest, error)
	GetBookRequest(id string) (*BookRequest, error)
	UpdateBookRequest(bookRequest *BookRequest, updateBookRequest BookRequestUpdate) (*BookRequest, error)
	DeleteBookRequest(bookRequest *BookRequest) error
}

type requestRepository struct {
	db *gorm.DB
}

func NewRequestRepository(db *gorm.DB) RequestRepository {
	return &requestRepository{db: db}
}

func (r *requestRepository) CreateBookRequest(request *BookRequest) (*BookRequest, error) {
	if err := r.db.Create(request).Error; err != nil {
		return nil, err
	}
	return request, nil
}

func (r *requestRepository) GetAllBookRequests() ([]BookRequest, error) {
	var bookRequest []BookRequest

	if err := r.db.Order("id DESC").Find(&bookRequest).Error; err != nil {
		return bookRequest, err
	}

	return bookRequest, nil
}

func (r *requestRepository) GetBookRequests(limit, offset int, requestorID *string) ([]BookRequest, error) {
	var bookRequests []BookRequest

	// Start building the query
	query := r.db.Order("id DESC")

	// Apply filtering if RequestorID is provided
	if requestorID != nil && *requestorID != "" {
		query = query.Where("requestor_id = ?", *requestorID)
	}

	// Apply Limit and Offset
	query = query.Limit(limit).Offset(offset)

	// Execute the query
	if err := query.Find(&bookRequests).Error; err != nil {
		return nil, err
	}

	return bookRequests, nil
}

func (r *requestRepository) GetBookRequest(id string) (*BookRequest, error) {
	var bookRequest BookRequest
	if err := r.db.Model(BookRequest{}).Where("id = ?", id).First(&bookRequest).Error; err != nil {
		return nil, err
	}
	return &bookRequest, nil
}

func (r *requestRepository) UpdateBookRequest(bookRequest *BookRequest, updateBookRequest BookRequestUpdate) (*BookRequest, error) {
	// Edit the bookRequest
	if updateBookRequest.ApprovalStatus != nil {
		bookRequest.ApprovalStatus = *updateBookRequest.ApprovalStatus
	}
	if updateBookRequest.DownloadStatus != nil {
		bookRequest.DownloadStatus = *updateBookRequest.DownloadStatus
		if bookRequest.DownloadStatus == "complete" {
			bookRequest.DownloadSource = nil
		}
	}
	if bookRequest.DownloadStatus == "complete" {
		bookRequest.DownloadSource = updateBookRequest.DownloadSource
	}

	err := r.db.Model(bookRequest).
		Updates(map[string]any{
			"approval_status": bookRequest.ApprovalStatus,
			"download_status": bookRequest.DownloadStatus,
			"download_source": bookRequest.DownloadSource,
		}).Error

	// Return the updated bookRequest
	return bookRequest, err
}

func (r *requestRepository) DeleteBookRequest(bookRequest *BookRequest) error {
	return r.db.Unscoped().Delete(&bookRequest, bookRequest.ID).Error
}
