/* eslint-disable import/no-unresolved */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, HelpCircleIcon, Menu } from "lucide-react";
import { LinearProcessFlow } from "@/components/LinearProcessFlow";
import Sidebar from "@/components/Sidebar";
import { useOptionalUser } from "@/utils";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { redirect } from "@remix-run/react";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { getUserToken } from "@/session.server";
import UserAvatar from "@/components/UserAvatar";

// Define the loader for user authentication.
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (!userToken) return redirect("/auth");
  return Response.json({ userToken });
};

export default function HelpPage() {
  const user = useOptionalUser();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar user={user} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shadow-sm w-full">
          <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex-1 flex items-center justify-end">
              <UserAvatar user={user} />
            </div>
          </div>
        </header>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <main className="flex-1 p-4">
            <h1 className="text-3xl font-bold mb-6">Help Center</h1>
            <div className="container mx-auto">
              <Alert className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Welcome to the Help Center</AlertTitle>
                <AlertDescription>
                  Here you&apos;ll find guides and information on how to use
                  Seeklit effectively.
                </AlertDescription>
              </Alert>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Follow these steps to begin using Seeklit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LinearProcessFlow>
                    {`### Search for a Book
                  Click the "🔍 Seek" button on the left menu bar. Once on the home page, you can put your search field into the top bar.
                  The search should happen while you type. If your search doesn't happen, you can try hitting 'enter' on your keyboard. 
                  Please note that if your search isn't returning any results you may need to broaden the search terms.

                  ### Request a Book
                  After searching for a book, the results will populate below. Once you've double checked that you've found the book you want, you can click the "request" button below the book.
                  
                  ### Be patient 😊
                  Once you request a book, it could be added to the library instantly, or it could take some time. Please be patient after you've submitted your request.
                  `}
                  </LinearProcessFlow>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Need More Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="mt-4" asChild>
                    <a
                      href={`mailto:${import.meta.env.VITE_ADMIN_EMAIL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <HelpCircleIcon
                        className="w-4 h-4 mr-2"
                        aria-hidden="true"
                      />
                      <span>Contact Admin</span>
                      <span className="sr-only">contact admin</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
