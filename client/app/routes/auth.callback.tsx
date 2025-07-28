import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createUserSession } from "@/session.server";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";

// Handle session validation on the server side for successful callbacks
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const success = url.searchParams.get("success");

  // Redirect to auth page if there's an error
  if (error) {
    return redirect("/auth?error=" + encodeURIComponent(error));
  }

  // If this is a successful callback, the server has already set the session cookie
  if (success === "true") {
    console.log(
      "Successful auth callback, server should have set session cookie"
    );

    // Test if the session cookie is working by trying to get user info
    try {
      const serverUrl = process.env.SEEKLIT_SERVER_URL || url.origin;
      const response = await fetch(`${serverUrl}/api/v1/auth/tokens`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("Cookie") || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          console.log("Session cookie is valid, redirecting to home");
          // Session is valid, redirect to home
          return redirect("/");
        }
      }
    } catch (error) {
      console.error("Failed to validate session cookie:", error);
    }
  }

  // Let the client-side component handle the callback if server-side validation fails
  return {};
};

// This component handles the OIDC callback on the client side
export default function OIDCCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const success = searchParams.get("success");
        const errorParam = searchParams.get("error");

        // Handle errors from the URL
        if (errorParam) {
          console.error("Auth callback error:", errorParam);
          setError(errorParam);
          setTimeout(
            () => navigate(`/auth?error=${encodeURIComponent(errorParam)}`),
            2000
          );
          return;
        }

        // Check if this is a successful callback from the server redirect
        if (success !== "true") {
          const errorMsg = "Invalid callback - missing success parameter";
          console.error(errorMsg);
          setError(errorMsg);
          setTimeout(
            () => navigate(`/auth?error=${encodeURIComponent(errorMsg)}`),
            2000
          );
          return;
        }

        setStatus("Verifying authentication...");

        // Server has already processed the OAuth callback and set the session cookie
        // Test if the session is working by trying to get user info
        try {
          const response = await fetch("/api/v1/auth/tokens", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // This will send the session cookie
          });

          console.log("Session validation response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              console.log(
                "Session cookie is valid, user authenticated:",
                data.user.username
              );
              setStatus("Authentication successful! Redirecting...");

              // Navigate to home page
              setTimeout(() => navigate("/"), 1000);
              return;
            }
          }

          // If we get here, the session cookie is not working
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || "Session validation failed";
          console.error("Session validation failed:", errorData);
          setError(errorMsg);
          setTimeout(
            () => navigate(`/auth?error=${encodeURIComponent(errorMsg)}`),
            2000
          );
        } catch (sessionError) {
          console.error("Failed to validate session:", sessionError);
          setError("Failed to validate authentication session");
          setTimeout(
            () => navigate("/auth?error=Failed+to+validate+session"),
            2000
          );
        }
      } catch (error) {
        console.error("Auth callback processing error:", error);
        setError("Authentication processing failed");
        setTimeout(
          () => navigate("/auth?error=Authentication+processing+failed"),
          2000
        );
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">{status}</h2>
        {error ? (
          <p className="text-red-500">
            Error: {error}. Redirecting to login page...
          </p>
        ) : (
          <p className="text-muted-foreground">
            Please wait while we complete your sign-in.
          </p>
        )}
      </div>
    </div>
  );
}
