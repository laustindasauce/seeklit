import { createCookieSessionStorage, redirect } from "@remix-run/node";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "seeklit_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "1516f9724a85dc602555cc4f1"],
    // secure: process.env.NODE_ENV === "production",
  },
});

async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserToken(
  request: Request
): Promise<User["accessToken"] | undefined> {
  // Get user from server session and return their token for compatibility
  const user = await getUser(request);
  return user?.accessToken;
}

export async function getUser(request: Request) {
  console.log("getUser called, checking server session cookie");

  try {
    // Get user info directly from server using session cookie
    // The server will validate the session cookie and return user info
    const serverUrl =
      process.env.SEEKLIT_SERVER_URL || new URL(request.url).origin;
    const response = await fetch(`${serverUrl}/api/v1/auth/tokens`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("Cookie") || "",
      },
    });

    console.log("Server session validation response status:", response.status);

    if (response.ok) {
      const userInfo = await response.json();
      console.log("getUserInfo response:", {
        hasUserInfo: !!userInfo,
        hasUser: !!(userInfo && userInfo.user),
        authSource: userInfo?.user?.auth_source,
      });

      if (userInfo && userInfo.user) {
        // Ensure accessToken is available for compatibility
        if (!userInfo.user.accessToken && userInfo.user.token) {
          userInfo.user.accessToken = userInfo.user.token;
        }

        console.debug(`User type: ${userInfo.user.type}`);
        console.log(
          `User authenticated via ${userInfo.user.auth_source} (session cookie)`
        );

        return userInfo.user;
      }
    }

    // If server session validation fails, user is not authenticated
    console.log(
      "Server session validation failed or returned invalid response"
    );
    return null;
  } catch (error) {
    console.error("Failed to validate server session:", error);
    return null;
  }
}

export async function logout(request: Request) {
  console.log("Logout called, clearing server session");

  try {
    // Call server logout endpoint to clear the session cookie
    const serverUrl =
      process.env.SEEKLIT_SERVER_URL || new URL(request.url).origin;
    await fetch(`${serverUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("Cookie") || "",
      },
    });
    console.log("Server logout completed");
  } catch (error) {
    console.error("Server logout error:", error);
    // Continue with redirect even if server logout fails
  }

  // Clear any legacy Remix session data and redirect
  const session = await getSession(request);
  return redirect("/auth", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
