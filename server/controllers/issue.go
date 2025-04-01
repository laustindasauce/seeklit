package controllers

import (
	"api/database"
	"api/lib/notifications"
	"api/middlewares"
	"api/models"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/beego/beego/v2/core/config"
	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
)

// Operations about Issue
type IssueController struct {
	beego.Controller
}

// @Title CreateIssue
// @Description create issue
// @Param	body		body 	models.Issue	true		"body for issue content"
// @Success 201 {object} []models.Issue
// @Failure 400 bad request
// @router / [post]
func (i *IssueController) Post() {
	issue := new(models.Issue)
	if err := json.Unmarshal(i.Ctx.Input.RequestBody, &issue); err != nil {
		logs.Warn("Error unmarshalling CreateIssue body: %v\n", err)
		i.Ctx.Output.SetStatus(http.StatusBadRequest)
		i.Data["json"] = map[string]string{"error": "Unable to parse issue in body."}
		i.ServeJSON()
		return
	}

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.CreateIssue(issue)
	if err != nil {
		logs.Warn("Error creating Issue: %v\n", err)
		i.Ctx.Output.SetStatus(http.StatusInternalServerError)
		i.Data["json"] = map[string]string{"error": "Internal Server error occurred while creating issue."}
		i.ServeJSON()
		return
	}

	logs.Info("Issue #%d created successfully.", issue.ID)
	title := fmt.Sprintf("🆕📔 issue #%d submitted on Seeklit by %s!!", issue.ID, issue.CreatorUsername)
	body := fmt.Sprintf(`%s: %s/item/%s`, issue.BookTitle,
		config.DefaultString("general::audiobookshelfurl", ""), issue.BookID)
	notifications.SendNotification(title, body)

	i.Data["json"] = *issue

	i.Ctx.Output.SetStatus(http.StatusCreated)
}

// @Title GetAllIssues
// @Description Retrieve all issues objects from the database.
// @Param	limit		query	int		false		"Limit of issue objects, defaults to 20"
// @Param	offset		query	int		false		"Offset of issue objects, defaults to 0"
// @Success 200 {object} []models.Issue
// @Failure 403 Unauthorized
// @router / [get]
func (i *IssueController) GetAll() {
	user := middlewares.GetUser(i.Ctx)

	limit, err := i.GetInt("limit", 20)
	if err != nil {
		limit = 20
	}

	offset, err := i.GetInt("offset", 0)
	if err != nil {
		offset = 0
	}

	issueRepository := models.NewIssueRepository(database.DB)

	// Set creator ID if the user isn't admin/root
	var creatorID *string = nil
	if user.Type != "root" && user.Type != "admin" {
		creatorID = &user.ID
	}

	issues, err := issueRepository.GetIssues(limit, offset, creatorID)
	if err != nil {
		i.Ctx.Output.SetStatus(http.StatusInternalServerError)
		i.Data["json"] = map[string]string{"error": "Unable to retrieve issues due to an internal server erroi."}
		i.ServeJSON()
		return
	}

	i.Data["json"] = issues
	i.ServeJSON()
}

// @Title GetIssueByID
// @Description get issue by id
// @Param	id		path 	string	true		"The Issue ID"
// @Success 200 {object} models.Issue
// @router /:id [get]
func (i *IssueController) Get() {
	user := middlewares.GetUser(i.Ctx)

	id := i.GetString(":id")

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.GetIssue(id)
	if err != nil {
		i.Ctx.Output.SetStatus(http.StatusNotFound)
		i.Data["json"] = map[string]string{"error": "No issue found with that id."}
		i.ServeJSON()
		return
	}

	if issue.CreatorID != user.ID && user.Type != "root" && user.Type != "admin" {
		i.Ctx.Output.SetStatus(http.StatusForbidden)
		i.Data["json"] = map[string]string{"error": "Access denied."}
		i.ServeJSON()
		return
	}

	i.Data["json"] = issue

	i.ServeJSON()
}

// @Title Update
// @Description update the issue
// @Param	id		path 	string	true		"The id you want to update"
// @Param	body		body 	models.Issue	true		"body for issue content"
// @Success 200 {object} models.Issue
// @Failure 403 Unauthorized
// @router /:id [patch]
func (i *IssueController) Patch() {
	user := middlewares.GetUser(i.Ctx)

	id := i.GetString(":id")

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.GetIssue(id)
	if err != nil {
		i.Ctx.Output.SetStatus(http.StatusNotFound)
		i.Data["json"] = map[string]string{"error": "No issue found with that id."}
		i.ServeJSON()
		return
	}

	if issue.CreatorID != user.ID && user.Type != "root" && user.Type != "admin" {
		i.Ctx.Output.SetStatus(http.StatusForbidden)
		i.Data["json"] = map[string]string{"error": "Access denied."}
		i.ServeJSON()
		return
	}

	issueUpdate := new(models.IssueUpdate)
	if err := json.Unmarshal(i.Ctx.Input.RequestBody, &issueUpdate); err != nil {
		logs.Warn("Error unmarshalling UpdateIssue body: %v\n", err)
		i.Ctx.Output.SetStatus(http.StatusBadRequest)
		i.Data["json"] = map[string]string{"error": "Unable to parse issue update in body."}
		i.ServeJSON()
		return
	}

	issue, err = issueRepository.UpdateIssue(issue, *issueUpdate)
	if err != nil {
		logs.Warn("Error creating Issue: %v\n", err)
		i.Ctx.Output.SetStatus(http.StatusInternalServerError)
		i.Data["json"] = map[string]string{"error": "Internal Server error occurred while creating issue."}
		i.ServeJSON()
		return
	}

	logs.Info("issue #%d updated successfully.", issue.ID)

	i.Data["json"] = *issue

	i.ServeJSON()
}

// @Title Delete
// @Description delete the issue
// @Param	id		path 	string	true		"The id you want to delete"
// @Success 204
// @Failure 403 Unauthorized
// @router /:id [delete]
func (i *IssueController) Delete() {
	user := middlewares.GetUser(i.Ctx)

	id := i.GetString(":id")

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.GetIssue(id)
	if err != nil {
		i.Ctx.Output.SetStatus(http.StatusNotFound)
		i.Data["json"] = map[string]string{"error": "No issue found with that id."}
		i.ServeJSON()
		return
	}

	if issue.CreatorID != user.ID && user.Type != "root" && user.Type != "admin" {
		i.Ctx.Output.SetStatus(http.StatusForbidden)
		i.Data["json"] = map[string]string{"error": "Access denied."}
		i.ServeJSON()
		return
	}

	if err := issueRepository.DeleteIssue(issue); err != nil {
		logs.Warn("Error deleting issue: %v\n", err)
		i.Ctx.Output.SetStatus(http.StatusInternalServerError)
		i.Data["json"] = map[string]string{"error": "Internal Server error occurred while deleting issue."}
		i.ServeJSON()
		return
	}

	i.Ctx.Output.SetStatus(http.StatusNoContent)
}
