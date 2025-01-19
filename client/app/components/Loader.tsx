/* eslint-disable import/no-unresolved */
import { json, redirect } from "@remix-run/node";
import { api } from "@/lib/api";

// Define the loader for user authentication.
export default async function loader() {
  try {
    const user = await api.getUser;
    return json({ user });
  } catch (error) {
    // Redirect to the auth page if the user is not authenticated.
    return redirect("/auth");
  }
}
