package routers

import (
	beego "github.com/beego/beego/v2/server/web"
	"github.com/beego/beego/v2/server/web/context/param"
)

func init() {

    beego.GlobalControllerRouter["api/controllers:ConfigController"] = append(beego.GlobalControllerRouter["api/controllers:ConfigController"],
        beego.ControllerComments{
            Method: "Get",
            Router: `/`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:ConfigController"] = append(beego.GlobalControllerRouter["api/controllers:ConfigController"],
        beego.ControllerComments{
            Method: "UpdateConfig",
            Router: `/`,
            AllowHTTPMethods: []string{"patch"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:IssueController"] = append(beego.GlobalControllerRouter["api/controllers:IssueController"],
        beego.ControllerComments{
            Method: "Post",
            Router: `/`,
            AllowHTTPMethods: []string{"post"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:IssueController"] = append(beego.GlobalControllerRouter["api/controllers:IssueController"],
        beego.ControllerComments{
            Method: "GetAll",
            Router: `/`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:IssueController"] = append(beego.GlobalControllerRouter["api/controllers:IssueController"],
        beego.ControllerComments{
            Method: "Get",
            Router: `/:id`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:IssueController"] = append(beego.GlobalControllerRouter["api/controllers:IssueController"],
        beego.ControllerComments{
            Method: "Patch",
            Router: `/:id`,
            AllowHTTPMethods: []string{"patch"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:IssueController"] = append(beego.GlobalControllerRouter["api/controllers:IssueController"],
        beego.ControllerComments{
            Method: "Delete",
            Router: `/:id`,
            AllowHTTPMethods: []string{"delete"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:MonitoringController"] = append(beego.GlobalControllerRouter["api/controllers:MonitoringController"],
        beego.ControllerComments{
            Method: "Get",
            Router: `/`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:ObjectController"] = append(beego.GlobalControllerRouter["api/controllers:ObjectController"],
        beego.ControllerComments{
            Method: "Post",
            Router: `/`,
            AllowHTTPMethods: []string{"post"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:ObjectController"] = append(beego.GlobalControllerRouter["api/controllers:ObjectController"],
        beego.ControllerComments{
            Method: "GetAll",
            Router: `/`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:ObjectController"] = append(beego.GlobalControllerRouter["api/controllers:ObjectController"],
        beego.ControllerComments{
            Method: "Get",
            Router: `/:objectId`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:ObjectController"] = append(beego.GlobalControllerRouter["api/controllers:ObjectController"],
        beego.ControllerComments{
            Method: "Put",
            Router: `/:objectId`,
            AllowHTTPMethods: []string{"put"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:ObjectController"] = append(beego.GlobalControllerRouter["api/controllers:ObjectController"],
        beego.ControllerComments{
            Method: "Delete",
            Router: `/:objectId`,
            AllowHTTPMethods: []string{"delete"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:RequestController"] = append(beego.GlobalControllerRouter["api/controllers:RequestController"],
        beego.ControllerComments{
            Method: "Post",
            Router: `/`,
            AllowHTTPMethods: []string{"post"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:RequestController"] = append(beego.GlobalControllerRouter["api/controllers:RequestController"],
        beego.ControllerComments{
            Method: "GetAll",
            Router: `/`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:RequestController"] = append(beego.GlobalControllerRouter["api/controllers:RequestController"],
        beego.ControllerComments{
            Method: "Get",
            Router: `/:id`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:RequestController"] = append(beego.GlobalControllerRouter["api/controllers:RequestController"],
        beego.ControllerComments{
            Method: "Patch",
            Router: `/:id`,
            AllowHTTPMethods: []string{"patch"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:RequestController"] = append(beego.GlobalControllerRouter["api/controllers:RequestController"],
        beego.ControllerComments{
            Method: "Delete",
            Router: `/:id`,
            AllowHTTPMethods: []string{"delete"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:SearchController"] = append(beego.GlobalControllerRouter["api/controllers:SearchController"],
        beego.ControllerComments{
            Method: "GoogleSearch",
            Router: `/google`,
            AllowHTTPMethods: []string{"post"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:SearchController"] = append(beego.GlobalControllerRouter["api/controllers:SearchController"],
        beego.ControllerComments{
            Method: "HardcoverSearch",
            Router: `/hardcover`,
            AllowHTTPMethods: []string{"post"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:SearchController"] = append(beego.GlobalControllerRouter["api/controllers:SearchController"],
        beego.ControllerComments{
            Method: "OpenLibrarySearch",
            Router: `/openlib`,
            AllowHTTPMethods: []string{"post"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

    beego.GlobalControllerRouter["api/controllers:SearchController"] = append(beego.GlobalControllerRouter["api/controllers:SearchController"],
        beego.ControllerComments{
            Method: "PersonalizedSearch",
            Router: `/personalized`,
            AllowHTTPMethods: []string{"get"},
            MethodParams: param.Make(),
            Filters: nil,
            Params: nil})

}
