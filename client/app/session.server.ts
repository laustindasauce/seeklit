import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { api } from "./lib/api";
import { localApi } from "./lib/localApi";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "1516f9724a85dc602555cc4f1"],
    // secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userToken";

export async function createUserSession({
  request,
  userToken,
}: {
  request: Request;
  userToken: string;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userToken);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: 60 * 60 * 24 * 7, // 7 days,
      }),
    },
  });
}

async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserToken(
  request: Request
): Promise<User["accessToken"] | undefined> {
  const session = await getSession(request);
  const userToken = session.get(USER_SESSION_KEY);
  return userToken;
}

export async function getUser(request: Request) {
  const userToken = await getUserToken(request);
  if (userToken === undefined) return null;

  try {
    // First try to get user info from our server's unified auth endpoint
    const userInfo = await localApi.getUserInfo(userToken);
    if (userInfo && userInfo.user) {
      // Ensure accessToken is available
      if (!userInfo.user.accessToken && userInfo.user.token) {
        userInfo.user.accessToken = userInfo.user.token;
      }
      // Add auth_source to the user object
      userInfo.user.auth_source = userInfo.auth_source;

      // Log successful authentication
      console.log(`User authenticated via ${userInfo.auth_source}`);

      return userInfo.user;
    }
  } catch (error) {
    console.error("Failed to get user info from server:", error);

    // Fallback to direct Audiobookshelf API call
    try {
      // Get auth info to check if audiobookshelf auth is enabled
      const authInfo = await localApi.getAuthInfo().catch(() => ({
        method: "audiobookshelf",
        available_methods: { audiobookshelf: true, oidc: false },
      }));

      // Only try audiobookshelf if it's enabled
      if (authInfo.available_methods.audiobookshelf) {
        const clientOrigin = request.headers.get("origin") || "";
        const user = await api.getUser(clientOrigin, userToken);
        if (user) {
          // Ensure accessToken is available
          if (!user.accessToken && user.token) {
            user.accessToken = user.token;
          }
          // Mark as audiobookshelf auth
          user.auth_source = "audiobookshelf";

          console.log("User authenticated via audiobookshelf fallback");
          return user;
        }
      }
    } catch (absError) {
      console.error("Failed to get user from Audiobookshelf:", absError);
    }
  }

  // If we get here, authentication failed
  console.error("Authentication failed completely, logging out");
  throw await logout(request);
}

export async function logout(request: Request) {
  const session = await getSession(request);
  const userToken = session.get(USER_SESSION_KEY);

  // Try to logout from the server if we have a token
  if (userToken) {
    try {
      // Get the current user to determine auth source
      const userInfo = await localApi.getUserInfo(userToken).catch(() => null);
      const authSource = userInfo?.auth_source;

      console.log(
        `Logging out user with auth source: ${authSource || "unknown"}`
      );

      if (authSource === "oidc") {
        // Use OIDC logout for OIDC users
        await localApi.oidcLogout();
      } else if (authSource === "audiobookshelf") {
        // Use Audiobookshelf logout for Audiobookshelf users
        const clientOrigin = request.headers.get("origin") || "";
        await api.logout(clientOrigin);
      } else {
        // If auth source is unknown, try both methods
        try {
          await localApi.oidcLogout();
        } catch (oidcError) {
          console.error("OIDC logout error:", oidcError);
          try {
            const clientOrigin = request.headers.get("origin") || "";
            await api.logout(clientOrigin);
          } catch (absError) {
            console.error("Audiobookshelf logout error:", absError);
          }
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with session destruction even if logout API calls fail
    }
  }

  // Always destroy the session regardless of logout API success
  return redirect("/auth", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
