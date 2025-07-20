/* eslint-disable import/no-unresolved */
import AdminConfiguration from "@/components/AdminConfiguration";
import Sidebar from "@/components/Sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { localApi } from "@/lib/localApi";
import { getEnvVal } from "@/lib/utils";
import { getUserToken } from "@/session.server";
import { useOptionalUser } from "@/utils";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { ConstructionIcon, InfoIcon, MenuIcon } from "lucide-react";
import React from "react";

// Define the loader for user authentication.
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (!userToken) return redirect("/auth");
  return Response.json({ userToken });
};

// Mock config data
const defaultConfig = {
  db: {
    defaultaprrovalstatus: "pending",
    logcolorful: "true",
    loglevel: "warn",
    path: "/data",
  },
  default: {
    appname: "seeklit",
    autorender: "false",
    copyrequestbody: "true",
    enabledocs: "true",
    httpport: "8416",
    routercasesensitive: "false",
    runmode: "prod",
  },
  download: {
    blockedterms:
      "bundle,collection,preview,chapters,/,box set,collected works,book set,mystery writers,mystery stories,novels,sneak peek,oldswe,cbz,sampler",
    cwaenabled: "false",
    cwaurl: "http://cwa-downloader:8084",
    ebookmaxbytes: "25 << 20",
    ebookminbytes: "104858",
  },
  general: {
    audiobookshelfurl: "http://audiobookshelf:80",
    level: "6",
  },
  metadata: {
    googleapikey: "",
    hardcoverbearertoken: "",
    provider: "OPENLIBRARY",
  },
  notify: {
    telegrambottoken: "",
    telegramchatid: "",
    telegramenabled: "false",
  },
};

export default function SettingsPage() {
  const user = useOptionalUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<ServerConfig>(defaultConfig);

  const clientOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  React.useEffect(() => {
    const getServerConfig = async (token: string) => {
      const res = await localApi.getServerConfig(token);
      setConfig(res);
    };

    if (user) {
      getServerConfig(user.accessToken);
    }
  }, [user]);

  return (
    <div className="flex h-screen">
      <Sidebar user={user} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shadow-sm w-full">
          <Toaster />
          <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex-1 flex items-center justify-end">
              <UserAvatar user={user} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-auto p-4">
          <div className="container">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <Tabs defaultValue="account" className="space-y-4">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                {user?.type === "root" && (
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                )}
                {/* <TabsTrigger value="privacy">Privacy</TabsTrigger> */}
              </TabsList>
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information </CardTitle>
                    {/* <CardDescription>
                  Update your account details on Audiobookshelf.
                </CardDescription> */}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="mb-4 border-blue-200 bg-blue-100 text-blue-900">
                      {/* Added color hex for blue-900 */}
                      <InfoIcon className="h-4 w-4" color="#0D47A1" />
                      <AlertTitle>External Management</AlertTitle>
                      <AlertDescription>
                        Your account details are managed in{" "}
                        <a
                          className="underline"
                          href={getEnvVal(
                            import.meta.env.VITE_ABS_EXTERNAL_URL,
                            clientOrigin
                          )}
                        >
                          Audiobookshelf
                        </a>
                        .
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user?.username} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-type">User Type</Label>
                      <Input id="user-type" value={user?.type} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="can-req">Can Request</Label>
                      <Checkbox
                        id="can-req"
                        className="ml-3"
                        disabled
                        checked={user?.permissions.download}
                      />
                      {/* <Select>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select> */}
                    </div>
                    <Button className="space-y-2">
                      <a href="/logout">Logout</a>
                    </Button>
                  </CardContent>
                  {/* <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter> */}
                </Card>
              </TabsContent>
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage your notification settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="mb-4 border-yellow-200 bg-yellow-100 text-yellow-900">
                      {/* Added color hex for blue-900 */}
                      <ConstructionIcon className="h-4 w-4" color="#9F3F12" />
                      <AlertTitle>Coming soon...</AlertTitle>
                      <AlertDescription>
                        Notifications will be enabled in a future release!
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="can-req">Notification Type</Label>
                      <Checkbox
                        id="can-req"
                        className="ml-3"
                        disabled
                        checked={user?.permissions.download}
                      />
                      <Select>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="discord">Discord</SelectItem>
                          <SelectItem value="telegram">Telegram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="on-approved">On Approval</Label>
                      <Switch id="on-approved" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="on-status-change">On Status Change</Label>
                      <Switch id="on-status-change" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="on-completed">On Completed</Label>
                      <Switch id="on-completed" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button disabled>Save Preferences</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="privacy">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Manage your privacy preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="profile-visibility">
                        Profile Visibility
                      </Label>
                      <Select>
                        <SelectTrigger
                          id="profile-visibility"
                          className="w-[180px]"
                        >
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="data-sharing">Data Sharing</Label>
                      <Switch id="data-sharing" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="two-factor">
                        Two-Factor Authentication
                      </Label>
                      <Button variant="outline" className="w-full">
                        Enable Two-Factor Auth
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Update Privacy Settings</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              {user?.type === "root" && (
                <TabsContent value="admin">
                  <AdminConfiguration
                    config={config}
                    setConfig={setConfig}
                    userToken={user.accessToken}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
