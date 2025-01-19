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
	book, err := cwa.HandleSearchAndDownload(*request)
	if err != nil {
		logs.Info("Unable to download book check logs. Updating status...")
		status = models.DSFailure
	} else {
		message := fmt.Sprintf(`✔️🎉 request #%d has been successfully retrieved from cwa.
        \nBook Info:\n\tTitle: %s\n\tAuthor: %s\n\tID: %s\n\tSize: %s\n\tFormat: %s\n\tYear: %s`,
			request.ID, book.Title, book.Author, book.ID, book.Size, book.Format, book.Year)

		notifications.SendNotification(message)
		status = models.DSComplete
	}

	updatedReq, err := requestRepository.UpdateBookRequest(request,
		models.BookRequestUpdate{DownloadStatus: &status})
	if err != nil {
		logs.Critical("Unable to update request download attempt.\n%v\n", err)
	} else {
		request = updatedReq
	}

	return request
}
