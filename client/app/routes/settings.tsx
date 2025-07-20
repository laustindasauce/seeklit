/* eslint-disable import/no-unresolved */
import AdminConfiguration from "@/components/AdminConfiguration";
import NotificationSettings from "@/components/NotificationSettings";
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

export default function SettingsPage() {
  const user = useOptionalUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<ServerConfig>({});
  const [userPreferences, setUserPreferences] =
    React.useState<UserPreferences | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = React.useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isSendingVerification, setIsSendingVerification] =
    React.useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = React.useState(false);
  const { toast } = useToast();

  const clientOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  React.useEffect(() => {
    const getServerConfig = async (token: string) => {
      const res = await localApi.getServerConfig(token);
      setConfig(res);
    };

    const getUserPreferences = async (token: string) => {
      setIsLoadingPrefs(true);
      try {
        const prefs = await localApi.getUserPreferences(token);
        setUserPreferences(prefs);
      } catch (error) {
        console.error("Failed to load user preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    if (user) {
      getServerConfig(user.accessToken);
      getUserPreferences(user.accessToken);
    }
  }, [user, toast]);

  const handleSavePreferences = async () => {
    if (!user || !userPreferences) return;

    setIsSavingPrefs(true);
    try {
      const updatedPrefs = await localApi.updateUserPreferences(
        user.accessToken,
        {
          email: userPreferences.email,
          notificationsEnabled: userPreferences.notificationsEnabled,
        }
      );
      setUserPreferences(updatedPrefs);
      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      });
    } catch (error) {
      console.error("Failed to save user preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleEmailChange = (email: string) => {
    if (userPreferences) {
      setUserPreferences({ ...userPreferences, email });
    }
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    if (userPreferences) {
      setUserPreferences({ ...userPreferences, notificationsEnabled: enabled });
    }
  };

  // Helper function to check if SMTP is enabled
  const isSmtpEnabled = () => {
    return config?.smtp?.enabled === "true" && config?.smtp?.host;
  };

  const handleSendVerification = async () => {
    if (!user || !userPreferences?.email) return;

    setIsSendingVerification(true);
    try {
      await localApi.sendEmailVerification(user.accessToken);
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification code",
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!user || !verificationCode.trim()) return;

    setIsVerifyingEmail(true);
    try {
      await localApi.verifyEmail(user.accessToken, verificationCode.trim());
      // Refresh user preferences to get updated verification status
      const updatedPrefs = await localApi.getUserPreferences(user.accessToken);
      setUserPreferences(updatedPrefs);
      setVerificationCode("");
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified",
      });
    } catch (error) {
      console.error("Failed to verify email:", error);
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

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
                <NotificationSettings
                  user={user}
                  config={config}
                  userPreferences={userPreferences}
                  setUserPreferences={setUserPreferences}
                  isLoadingPrefs={isLoadingPrefs}
                  isSavingPrefs={isSavingPrefs}
                  onSavePreferences={handleSavePreferences}
                />
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
