import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { api } from "./lib/api";

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

  const clientOrigin = request.headers.get("origin") || "";

  const user = await api.getUser(clientOrigin, userToken);
  if (user) {
    // Ensure accessToken is available - fallback to token field if accessToken is missing
    if (!user.accessToken && user.token) {
      user.accessToken = user.token;
    }
    return user;
  }

  throw await logout(request);
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/auth", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
