import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createUserSession } from "@/session.server";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";

// Handle session creation on the server side for successful callbacks
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

  // If this is a successful callback, try to create a session
  if (success === "true") {
    // Check if we have a token in the URL first
    const urlToken = url.searchParams.get("token");
    if (urlToken) {
      console.log("Token found in URL, creating session from server-side");
      try {
        return await createUserSession({
          request,
          userToken: urlToken,
        });
      } catch (error) {
        console.error("Failed to create session from URL token:", error);
      }
    }

    // Fallback: try to get tokens from the server session
    try {
      // Determine the server URL for SSR
      const serverUrl = process.env.SEEKLIT_SERVER_URL || url.origin;

      // Try to get tokens from the server session
      const response = await fetch(`${serverUrl}/api/v1/auth/tokens`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("Cookie") || "",
        },
      });

      console.log("Tokens response status: ", response.status);

      if (response.ok) {
        const data = await response.json();
        // Use cookie field first (matches Audiobookshelf format), then fall back to ID token
        const token = data.cookie || data.id_token;

        console.log("Token retrieved from session: ", !!token);

        if (token) {
          // Create Remix session with the token
          return await createUserSession({
            request,
            userToken: token,
          });
        }
      }
    } catch (error) {
      console.error("Failed to create session from server tokens:", error);
    }
  }

  // Otherwise, let the client-side component handle the callback
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

        // Check if we have a token in the URL (from server redirect)
        const urlToken = searchParams.get("token");
        if (urlToken) {
          console.log("Token found in URL, creating session directly");
          setStatus("Creating session...");

          // Create session with the token from URL
          try {
            const response = await fetch("/auth/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: urlToken }),
              credentials: "include",
            });

            if (response.ok) {
              console.log("Session created successfully");
              setStatus("Authentication successful! Redirecting...");
              setTimeout(() => navigate("/"), 1000);
              return;
            } else {
              console.error("Failed to create session with URL token");
              // Fall through to token retrieval method
            }
          } catch (error) {
            console.error("Error creating session with URL token:", error);
            // Fall through to token retrieval method
          }
        }

        setStatus("Verifying authentication...");

        // Server has already processed the OAuth callback and stored tokens in session
        // Let's test if the session is working by trying to access a protected endpoint
        try {
          // Try to access the home page - if the session is valid, this should work
          const testResponse = await fetch("/", {
            method: "GET",
            credentials: "include",
          });

          if (testResponse.ok) {
            console.log("Session appears to be valid");
            setStatus("Authentication successful! Redirecting...");

            // Navigate to home page
            setTimeout(() => navigate("/"), 1000);
          } else {
            // Session might not be working, let's try to get tokens and create a new session
            console.log("Session test failed, trying to retrieve tokens...");

            const response = await fetch("/api/v1/auth/tokens", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            });

            console.log("Token fetch response status:", response.status);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMsg =
                errorData.error || "Failed to retrieve authentication tokens";
              console.error("Failed to get tokens:", errorData);
              setError(errorMsg);
              setTimeout(
                () => navigate(`/auth?error=${encodeURIComponent(errorMsg)}`),
                2000
              );
              return;
            }

            const data = await response.json();
            console.log("Token data received:", {
              hasAccessToken: !!data.access_token,
              hasIdToken: !!data.id_token,
              hasRefreshToken: !!data.refresh_token,
              hasUser: !!data.user,
              userInfo: data.user,
            });

            // Use the cookie field first (matches Audiobookshelf format), then fall back to ID token
            const token = data.cookie || data.id_token;

            if (!token) {
              const errorMsg =
                "No authentication token received from OIDC provider";
              console.error(errorMsg);
              setError(errorMsg);
              setTimeout(
                () => navigate(`/auth?error=${encodeURIComponent(errorMsg)}`),
                2000
              );
              return;
            }

            console.log("ID token found, session should be created by server");
            setStatus("Authentication successful! Redirecting...");

            // Navigate to home page - the server should have already created the session
            setTimeout(() => {
              console.log("Navigating to home page");
              navigate("/");
            }, 1000);
          }
        } catch (sessionError) {
          console.error("Failed to complete authentication:", sessionError);
          setError("Failed to complete authentication");
          setTimeout(
            () => navigate("/auth?error=Failed+to+complete+authentication"),
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
