import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type {
  LinksFunction,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";

import styles from "./tailwind.css?url";
import { getUser } from "./session.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  console.log("Root loader called for:", request.url);
  try {
    const user = await getUser(request);
    console.log("Root loader - user retrieved:", !!user);

    let userPreferences = null;
    if (user?.accessToken) {
      try {
        // Make server-side API call with cookies from the request
        const serverUrl =
          process.env.SEEKLIT_SERVER_URL || new URL(request.url).origin;
        const response = await fetch(`${serverUrl}/api/v1/user/preferences`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
        });

        if (response.ok) {
          userPreferences = await response.json();
        } else {
          console.warn(
            "Failed to load user preferences:",
            response.status,
            response.statusText
          );
        }
      } catch (prefError) {
        console.warn("Failed to load user preferences:", prefError);
      }
    }

    return Response.json({
      user,
      userPreferences,
    });
  } catch (error) {
    console.error("Root loader - getUser failed:", error);

    // Check if the error is a redirect response (from logout)
    if (
      error instanceof Response &&
      error.status >= 300 &&
      error.status < 400
    ) {
      console.log("Root loader - returning redirect response");
      return error; // Return the redirect response directly
    }

    // For other errors, just return null user
    return Response.json({
      user: null,
      userPreferences: null,
    });
  }
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { userPreferences } = useLoaderData<{
    user: User | null;
    userPreferences: UserPreferences | null;
  }>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const serverTheme = ${JSON.stringify(
                  userPreferences?.theme || null
                )};
                const theme = serverTheme || localStorage.getItem('theme') || 'system';
                const root = document.documentElement;
                
                if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                } else {
                  root.classList.add(theme);
                }
                
                // Update localStorage with server theme if available
                if (serverTheme) {
                  localStorage.setItem('theme', serverTheme);
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
