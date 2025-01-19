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
import {
  ActionFunction,
  ActionFunctionArgs,
  json,
  LoaderFunction,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { createUserSession, getUserToken } from "@/session.server";
import { getEnvVal } from "@/lib/utils";

// Define the action for handling login
export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const clientOrigin = request.headers.get("origin") || "";

  try {
    const data = await api.login(clientOrigin, username, password);
    if (!data.user.token) {
      return json(
        { error: "Login failed. Please check your credentials." },
        { status: 401 }
      );
    }
    console.log(`Creating client user session with token: ${data.user.token}`);
    return createUserSession({ request, userToken: data.user.token });
  } catch (error) {
    console.error(error);
    return json(
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
  return json({});
};

export default function SignInPage() {
  const actionData = useActionData<typeof action>();

  const clientOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your{" "}
            <a
              className="underline"
              href={getEnvVal(import.meta.env.VITE_ABS_URL, clientOrigin)}
            >
              Audiobookshelf
            </a>{" "}
            credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {/* <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Sign In"
              )}
            </Button> */}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </Form>
          {actionData?.error && (
            <p className="mt-4 text-sm text-red-500">{actionData.error}</p>
          )}
        </CardContent>
        {/* <CardFooter className="flex justify-center">
          <Button variant="link" className="text-sm text-muted-foreground">
            Forgot password?
          </Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
