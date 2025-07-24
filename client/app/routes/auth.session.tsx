import { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { createUserSessionResponse } from "@/session.server";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: "Token is required" }, { status: 400 });
    }

    // Create session with the provided token
    return await createUserSessionResponse({
      request,
      userToken: token,
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
};
