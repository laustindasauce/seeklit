/* eslint-disable import/no-unresolved */
import { getUserToken, logout } from "@/session.server";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (!userToken) return redirect("/auth");
  return await logout(request);
};

export default function LogoutRoute() {
  return null; // This route only exists to handle the logout logic.
}