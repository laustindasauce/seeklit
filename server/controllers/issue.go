package controllers

import (
	"api/database"
	"api/models"
	"encoding/json"
	"net/http"

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
// @Failure 403 body is empty
// @router / [post]
func (r *IssueController) Post() {
	issue := new(models.Issue)
	if err := json.Unmarshal(r.Ctx.Input.RequestBody, &issue); err != nil {
		logs.Warn("Error unmarshalling CreateIssue body: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusBadRequest)
		r.Data["json"] = map[string]string{"error": "Unable to parse issue in body."}
		r.ServeJSON()
		return
	}

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.CreateIssue(issue)
	if err != nil {
		logs.Warn("Error creating Issue: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Internal Server error occurred while creating issue."}
		r.ServeJSON()
		return
	}

	logs.Info("Issue #%d created successfully.", issue.ID)

	r.Data["json"] = *issue

	r.Ctx.Output.SetStatus(http.StatusCreated)
}

// @Title GetAllIssues
// @Description Retrieve all issues objects from the database.
// @Param	limit		query	int		false		"Limit of issue objects, defaults to 20"
// @Param	offset		query	int		false		"Offset of issue objects, defaults to 0"
// @Success 200 {object} []models.Issue
// @Failure 403 Unauthorized
// @router / [get]
func (r *IssueController) GetAll() {
	// currentIssue, err := authenticatedIssue(b.Ctx)
	// if err != nil {
	// 	b.Ctx.Output.SetStatus(http.StatusForbidden)
	// 	b.Data["json"] = map[string]string{"error": "Unauthorized"}
	// 	b.ServeJSON()
	// 	return
	// }

	// limit, err := b.GetInt("limit", 20)
	// if err != nil {
	// 	limit = 20
	// }

	// offset, err := b.GetInt("offset", 0)
	// if err != nil {
	// 	offset = 0
	// }

	// var issues []models.IssueDTO
	// if currentIssue.Type == "root" {
	// 	issues = models.GetAllIssues(limit, offset)
	// } else {
	// 	issues = models.GetIssuesForIssue(limit, offset, currentIssue.ID)
	// }

	issueRepository := models.NewIssueRepository(database.DB)

	issues, err := issueRepository.GetIssues()
	if err != nil {
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Unable to retrieve issues due to an internal server error."}
		r.ServeJSON()
		return
	}

	r.Data["json"] = issues
	r.ServeJSON()
}

// @Title GetIssueByID
// @Description get issue by id
// @Param	id		path 	string	true		"The key for staticblock"
// @Success 200 {object} models.Issue
// @router /:id [get]
func (u *IssueController) Get() {
	id := u.GetString(":id")

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.GetIssue(id)
	if err != nil {
		u.Data["json"] = err.Error()
	} else {
		u.Data["json"] = issue
	}

	u.ServeJSON()
}

// @Title Update
// @Description update the issue
// @Param	id		path 	string	true		"The id you want to update"
// @Param	body		body 	models.Issue	true		"body for issue content"
// @Success 200 {object} models.Issue
// @Failure 403 :id is not int
// @router /:id [patch]
func (r *IssueController) Patch() {
	id := r.GetString(":id")

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.GetIssue(id)
	if err != nil {
		r.Ctx.Output.SetStatus(http.StatusNotFound)
		r.Data["json"] = map[string]string{"error": "No issue found with that id."}
		r.ServeJSON()
		return
	}

	issueUpdate := new(models.IssueUpdate)
	if err := json.Unmarshal(r.Ctx.Input.RequestBody, &issueUpdate); err != nil {
		logs.Warn("Error unmarshalling UpdateIssue body: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusBadRequest)
		r.Data["json"] = map[string]string{"error": "Unable to parse issue update in body."}
		r.ServeJSON()
		return
	}

	issue, err = issueRepository.UpdateIssue(issue, *issueUpdate)
	if err != nil {
		logs.Warn("Error creating Issue: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Internal Server error occurred while creating issue."}
		r.ServeJSON()
		return
	}

	logs.Info("issue #%d updated successfully.", issue.ID)

	r.Data["json"] = *issue

	r.ServeJSON()
}

// @Title Delete
// @Description delete the issue
// @Param	id		path 	string	true		"The id you want to delete"
// @Success 204
// @Failure 403 id is empty
// @router /:id [delete]
func (r *IssueController) Delete() {
	id := r.GetString(":id")

	issueRepository := models.NewIssueRepository(database.DB)

	issue, err := issueRepository.GetIssue(id)
	if err != nil {
		r.Ctx.Output.SetStatus(http.StatusNotFound)
		r.Data["json"] = map[string]string{"error": "No issue found with that id."}
		r.ServeJSON()
		return
	}

	if err := issueRepository.DeleteIssue(issue); err != nil {
		logs.Warn("Error deleting issue: %v\n", err)
		r.Ctx.Output.SetStatus(http.StatusInternalServerError)
		r.Data["json"] = map[string]string{"error": "Internal Server error occurred while deleting issue."}
		r.ServeJSON()
		return
	}

	r.Ctx.Output.SetStatus(http.StatusNoContent)
}
