package helpers

import (
	"api/lib/cwa"
	"api/lib/notifications"
	"api/models"
	"fmt"

	"github.com/beego/beego/v2/core/logs"
)

func HandleDownload(request *models.BookRequest, requestRepository models.RequestRepository) *models.BookRequest {
	logs.Info("Book request is auto-approved. Beginning search.")
	var status models.DownloadStatus
	var dlSource *string

	book, err := cwa.HandleSearchAndDownload(*request)
	if err != nil || book == nil {
		logs.Info("Unable to download book check logs. Updating status...")
		status = models.DSFailure
	} else {
		cwaStr := "cwa"
		dlSource = &cwaStr
		title := fmt.Sprintf("✔️🎉 request #%d downloaded!", request.ID)
		body := fmt.Sprintf(`Source: %s

		Title: %s
		Author: %s
		ID: %s
		Size: %s
		Format: %s
		Year: %s`, cwaStr, book.Title, book.Author, book.ID,
			book.Size, book.Format, book.Year)

		notifications.SendNotification(title, body)
		status = models.DSComplete
	}

	updatedReq, err := requestRepository.UpdateBookRequest(request,
		models.BookRequestUpdate{DownloadStatus: &status, DownloadSource: dlSource})
	if err != nil {
		logs.Critical("Unable to update request download attempt.\n%v\n", err)
	} else {
		request = updatedReq
	}

	return request
}
