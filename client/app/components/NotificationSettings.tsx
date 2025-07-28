/* eslint-disable import/no-unresolved */
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { localApi } from "@/lib/localApi";
import { isAdmin } from "@/utils";
import { ConstructionIcon, InfoIcon } from "lucide-react";
import React from "react";

interface NotificationSettingsProps {
  user: any;
  config: ServerConfig;
  userPreferences: UserPreferences | null;
  setUserPreferences: React.Dispatch<
    React.SetStateAction<UserPreferences | null>
  >;
  isLoadingPrefs: boolean;
  isSavingPrefs: boolean;
  onSavePreferences: () => Promise<void>;
}

export default function NotificationSettings({
  user,
  config,
  userPreferences,
  setUserPreferences,
  isLoadingPrefs,
  isSavingPrefs,
  onSavePreferences,
}: NotificationSettingsProps) {
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isSendingVerification, setIsSendingVerification] =
    React.useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = React.useState(false);
  const [verificationCooldown, setVerificationCooldown] = React.useState(0);
  const { toast } = useToast();

  // Cooldown timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (verificationCooldown > 0) {
      interval = setInterval(() => {
        setVerificationCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [verificationCooldown]);

  // Helper function to check if SMTP is enabled
  const isSmtpEnabled = () => {
    return config?.smtp?.enabled === "true" && config?.smtp?.host;
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

  const handleSendVerification = async () => {
    if (!user || !userPreferences?.email || verificationCooldown > 0) return;
    await onSavePreferences();

    setIsSendingVerification(true);
    try {
      await localApi.sendEmailVerification();
      // Set 60 second cooldown after successful send
      setVerificationCooldown(60);
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
      await localApi.verifyEmail(verificationCode.trim());
      // Refresh user preferences to get updated verification status
      const updatedPrefs = await localApi.getUserPreferences();
      setUserPreferences(updatedPrefs);
      setVerificationCode("");
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified",
      });
    } catch (error) {
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
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Configure your email notifications for book requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSmtpEnabled() && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
            <ConstructionIcon className="h-4 w-4" />
            <AlertTitle>Email Notifications Disabled</AlertTitle>
            <AlertDescription>
              Email notifications are currently disabled by the administrator.
              SMTP must be configured in the admin settings to enable email
              notifications.
              {isAdmin(user) && (
                <span> You can configure SMTP settings in the Admin tab.</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        {isLoadingPrefs ? (
          <div className="text-center py-4">Loading preferences...</div>
        ) : (
          <>
            {isSmtpEnabled() && userPreferences?.email && (
              <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-900">
                <InfoIcon className="h-4 w-4" color="#0D47A1" />
                <AlertTitle className="text-blue-900">
                  Not Getting Emails?
                </AlertTitle>
                <AlertDescription className="text-blue-800">
                  Try to add <b>{import.meta.env.VITE_ADMIN_EMAIL}</b> to your
                  email contacts or check spam/junk folders.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={userPreferences?.email || ""}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={!isSmtpEnabled()}
              />
              {userPreferences?.email &&
                !userPreferences.emailVerified &&
                isSmtpEnabled() && (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-600">
                      Email verification required for notifications
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendVerification}
                        disabled={
                          isSendingVerification || verificationCooldown > 0
                        }
                      >
                        {isSendingVerification
                          ? "Sending..."
                          : verificationCooldown > 0
                          ? `Wait ${verificationCooldown}s`
                          : "Send Verification Email"}
                      </Button>
                    </div>
                  </div>
                )}
              {userPreferences?.email &&
                !userPreferences.emailVerified &&
                isSmtpEnabled() && (
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        className="w-32"
                      />
                      <Button
                        onClick={handleVerifyEmail}
                        disabled={isVerifyingEmail || !verificationCode.trim()}
                        size="sm"
                      >
                        {isVerifyingEmail ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </div>
                )}
              {userPreferences?.email &&
                userPreferences.emailVerified &&
                isSmtpEnabled() && (
                  <p className="text-sm text-green-600">✓ Email verified</p>
                )}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="notifications-enabled">
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for your book requests
                </p>
                <Switch
                  id="notifications-enabled"
                  checked={userPreferences?.notificationsEnabled || false}
                  onCheckedChange={handleNotificationsToggle}
                  disabled={
                    !userPreferences?.email ||
                    !isSmtpEnabled() ||
                    !userPreferences.emailVerified
                  }
                  className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400"
                />
              </div>
            </div>
            {userPreferences?.notificationsEnabled && isSmtpEnabled() && (
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium mb-2">
                  You'll receive notifications when:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Your book request is approved or denied</li>
                  <li>Your book request status changes</li>
                  <li>
                    The status changes for an issue you reported on a book
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSavePreferences}
          disabled={
            isSavingPrefs ||
            isLoadingPrefs ||
            !userPreferences ||
            !isSmtpEnabled()
          }
        >
          {isSavingPrefs ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
