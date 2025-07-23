/* eslint-disable import/no-unresolved */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { localApi } from "@/lib/localApi";
import {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { createUserSession, getUserToken } from "@/session.server";
import { getEnvVal } from "@/lib/utils";
import { useEffect, useState } from "react";

// Define the action for handling login
export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const clientOrigin = request.headers.get("origin") || "";

  try {
    console.log("Attempting login with username:", username);
    const data = await api.login(clientOrigin, username, password);
    if (!data.user.accessToken) {
      return Response.json(
        { error: "Login failed. Please check your credentials." },
        { status: 401 }
      );
    }
    return createUserSession({ request, userToken: data.user.accessToken });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Login failed. Please check your credentials." },
      { status: 401 }
    );
  }
};

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (userToken) return redirect("/");
  return Response.json({});
};

export default function SignInPage() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [isAuthInfoLoading, setIsAuthInfoLoading] = useState(true);

  const clientOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  // Fetch auth info on client side
  useEffect(() => {
    const fetchAuthInfo = async () => {
      setIsAuthInfoLoading(true);
      try {
        const info = await localApi.getAuthInfo();
        console.log("Auth info fetched:", info);
        setAuthInfo(info);
      } catch (err) {
        console.error("Failed to get auth info:", err);
        // Fallback to audiobookshelf only
        setAuthInfo({
          method: "audiobookshelf",
          available_methods: {
            audiobookshelf: true,
            oidc: false,
          },
        });
      } finally {
        setIsAuthInfoLoading(false);
      }
    };

    fetchAuthInfo();
  }, []);

  // Handle error from URL params (from OIDC callback)
  useEffect(() => {
    if (searchParams.get("error")) {
      setError(searchParams.get("error"));
    }
  }, [searchParams]);

  const showAudiobookshelf = authInfo?.available_methods?.audiobookshelf;
  const showOIDC = authInfo?.available_methods?.oidc;

  const handleOIDCLogin = async () => {
    setIsLoading(true);
    try {
      // Client-side OIDC login initiation
      if (typeof window !== "undefined") {
        const apiClient = await import("@/lib/localApi").then(
          (module) => module.localApi
        );
        await apiClient.initiateOIDCLogin();
      }
    } catch (error) {
      console.error("OIDC login failed:", error);
      setIsLoading(false);
      setError("Failed to initiate OIDC login. Please try again.");
    }
  };

  const getAuthDescription = () => {
    if (showOIDC && showAudiobookshelf) {
      return "Choose your preferred authentication method";
    } else if (showOIDC) {
      return "Sign in with your organization's OIDC provider";
    } else {
      return (
        <>
          Enter your{" "}
          <a
            className="underline"
            href={getEnvVal(import.meta.env.VITE_ABS_URL, clientOrigin)}
          >
            Audiobookshelf
          </a>{" "}
          credentials to access your account
        </>
      );
    }
  };

  // Get a more descriptive button label for OIDC
  const getOIDCButtonLabel = () => {
    if (authInfo?.method === "oidc" || authInfo?.method === "both") {
      // If we have provider info, use it
      if (authInfo.oidc?.provider_name) {
        return `Sign in with ${authInfo.oidc.provider_name}`;
      }
    }
    return "Sign in with OIDC";
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          {isAuthInfoLoading ? (
            <CardDescription>Loading authentication options...</CardDescription>
          ) : (
            <CardDescription>{getAuthDescription()}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthInfoLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            <>
              {/* OIDC Login Button */}
              {showOIDC && (
                <Button
                  onClick={handleOIDCLogin}
                  className="w-full"
                  variant="default"
                  disabled={isLoading}
                >
                  {isLoading ? "Redirecting..." : getOIDCButtonLabel()}
                </Button>
              )}

              {/* Separator when both methods are available */}
              {showOIDC && showAudiobookshelf && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              )}

              {/* Audiobookshelf Login Form */}
              {showAudiobookshelf && (
                <Form method="post" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      className="input-styled"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      className="border-gray-600 focus:border-gray-400 hover:border-gray-500 transition-colors"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" variant="outline">
                    {showOIDC ? "Sign in with Audiobookshelf" : "Sign In"}
                  </Button>
                </Form>
              )}
            </>
          )}

          {/* Display errors from either action (form submission) or client-side errors */}
          {(actionData?.error || error) && (
            <p className="mt-4 text-sm text-red-500">
              {actionData?.error || error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
