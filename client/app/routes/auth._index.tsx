/* eslint-disable import/no-unresolved */
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { localApi } from "@/lib/localApi";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { getUserToken } from "@/session.server";
import { useEffect, useState } from "react";

// No action needed for OIDC-only authentication

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (userToken) return redirect("/");
  return Response.json({});
};

export default function SignInPage() {
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
        // Fallback to OIDC only
        setAuthInfo({
          method: "oidc",
          available_methods: {
            audiobookshelf: false,
            oidc: true,
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

  // Auto-route to OIDC if auto-redirect is enabled
  useEffect(() => {
    if (
      authInfo &&
      authInfo.method === "oidc" &&
      authInfo.available_methods?.oidc &&
      authInfo.auto_redirect &&
      !isLoading
    ) {
      handleOIDCLogin();
    }
  }, [authInfo, isLoading]);

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
    return "Sign in with your organization's OIDC provider";
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
            </>
          )}

          {/* Display client-side errors */}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
