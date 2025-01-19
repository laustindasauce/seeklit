package controllers

import (
	"api/database"
	"api/helpers"
	"api/middlewares"
	"api/models"
	"encoding/json"
	"net/http"

	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
)

// Operations about Request
type RequestController struct {
	beego.Controller
}

// @Title CreateBookRequest
// @Description create bookRequests
// @Param	body		body 	models.BookRequest	true		"body for bookRequest content"
// @Success 201 {object} models.BookRequest
// @Failure 403 body is empty
// @router / [post]
func (r *RequestController) Post() {
	bookRequest := new(models.BookRequest)
	if err := json.Unmarshal(r.Ctx.Input.RequestBody, &bookRequest); err != nil {
		logs.Warn("Error unmarshalling CreateBookRequest body: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusBadRequest)
		r.Data["json"] = map[string]string{"error": "Unable to parse book request in body."}
		r.ServeJSON()
		return
	}

	requestRepository := models.NewRequestRepository(database.DB)

	request, err := requestRepository.CreateBookRequest(bookRequest)
	if err != nil {
		logs.Warn("Error creating BookRequest: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Internal Server error occurred while creating book request."}
		r.ServeJSON()
		return
	}

	logs.Info("Book request #%d created successfully.", request.ID)

	if request.ApprovalStatus == models.ASApproved {
		request = helpers.HandleDownload(request, requestRepository)
	}

	r.Data["json"] = *request

	r.Ctx.Output.SetStatus(http.StatusCreated)
	r.ServeJSON()
}

// @Title GetAllBookRequests
// @Description Retrieve all book request objects from the database.
// @Param	limit		query	int		false		"Limit of book request objects, defaults to 20"
// @Param	offset		query	int		false		"Offset of book request objects, defaults to 0"
// @Success 200 {object} []models.BookRequest
// @Failure 403 Unauthorized
// @router / [get]
func (r *RequestController) GetAll() {
	user := middlewares.GetUser(r.Ctx)

	limit, err := r.GetInt("limit", 20)
	if err != nil {
		limit = 20
	}

	offset, err := r.GetInt("offset", 0)
	if err != nil {
		offset = 0
	}

	requestRepository := models.NewRequestRepository(database.DB)

	// Set requestor ID if the user isn't admin/root
	var requestorID *string = nil
	if user.Type != "root" && user.Type != "admin" {
		requestorID = &user.ID
	}

	bookRequests, err := requestRepository.GetBookRequests(limit, offset, requestorID)
	if err != nil {
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Unable to retrieve book requests due to an internal server error."}
		r.ServeJSON()
		return
	}

	r.Data["json"] = bookRequests
	r.ServeJSON()
}

// @Title GetRequestByID
// @Description get bookRequest by id
// @Param	id		path 	string	true		"The key for staticblock"
// @Success 200 {object} models.BookRequest
// @router /:id [get]
func (u *RequestController) Get() {
	id := u.GetString(":id")

	requestRepository := models.NewRequestRepository(database.DB)

	bookRequest, err := requestRepository.GetBookRequest(id)
	if err != nil {
		u.Data["json"] = err.Error()
	} else {
		u.Data["json"] = bookRequest
	}

	u.ServeJSON()
}

// @Title Update
// @Description update the book request
// @Param	id		path 	string	true		"The id you want to update"
// @Param	body		body 	models.BookRequest	true		"body for book request content"
// @Success 200 {object} models.BookRequest
// @Failure 403 :id is not int
// @router /:id [patch]
func (r *RequestController) Patch() {
	id := r.GetString(":id")

	requestRepository := models.NewRequestRepository(database.DB)

	request, err := requestRepository.GetBookRequest(id)
	if err != nil {
		r.Ctx.Output.SetStatus(http.StatusNotFound)
		r.Data["json"] = map[string]string{"error": "No book request found with that id."}
		r.ServeJSON()
		return
	}

	bookRequestUpdate := new(models.BookRequestUpdate)
	if err := json.Unmarshal(r.Ctx.Input.RequestBody, &bookRequestUpdate); err != nil {
		logs.Warn("Error unmarshalling UpdateBookRequest body: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusBadRequest)
		r.Data["json"] = map[string]string{"error": "Unable to parse book request update in body."}
		r.ServeJSON()
		return
	}

	request, err = requestRepository.UpdateBookRequest(request, *bookRequestUpdate)
	if err != nil {
		logs.Warn("Error creating BookRequest: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Internal Server error occurred while creating book request."}
		r.ServeJSON()
		return
	}

	if request.ApprovalStatus == models.ASApproved && request.DownloadStatus == models.DSPending {
		logs.Info("Request approved, starting search!")
		request = helpers.HandleDownload(request, requestRepository)
	}

	logs.Info("Book request #%d updated successfully.", request.ID)

	r.Data["json"] = *request

	r.ServeJSON()
}

// @Title Delete
// @Description delete the book request
// @Param	id		path 	string	true		"The id you want to delete"
// @Success 204
// @Failure 404 id not found
// @router /:id [delete]
func (r *RequestController) Delete() {
	id := r.GetString(":id")

	requestRepository := models.NewRequestRepository(database.DB)

	request, err := requestRepository.GetBookRequest(id)
	if err != nil {
		r.Ctx.Output.SetStatus(http.StatusNotFound)
		r.Data["json"] = map[string]string{"error": "No book request found with that id."}
		r.ServeJSON()
		return
	}

	if err := requestRepository.DeleteBookRequest(request); err != nil {
		logs.Warn("Error deleting BookRequest: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Internal Server error occurred while deleting book request."}
		r.ServeJSON()
		return
	}

	r.Ctx.Output.SetStatus(http.StatusNoContent)
}
