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
    return Response.json({
      user,
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
    });
  }
};

export function Layout({ children }: { children: React.ReactNode }) {
  useLoaderData<{ user: User | null }>();
  // console.log(user)
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
