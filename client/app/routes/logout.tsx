import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { logout } from "@/session.server";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  return logout(request);
};

// No component needed for this route
export default function LogoutRoute() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Logging out...</h2>
        <p className="text-muted-foreground">
          Please wait while we sign you out.
        </p>
      </div>
    </div>
  );
}
