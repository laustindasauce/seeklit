/* eslint-disable import/no-unresolved */
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Clock, Edit, Info, Loader2Icon, Menu, Trash } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useOptionalUser } from "@/utils";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getUserToken } from "@/session.server";
import { localApi } from "@/lib/localApi";
import { useLoaderData } from "@remix-run/react";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEnvVal } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Define the data type for the loader
type LoaderData = {
  userToken: string;
  issues: Issue[];
};

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const userToken = await getUserToken(request);
  if (!userToken) return redirect("/auth");
  const clientOrigin = request.headers.get("referer") || "";
  let origin = "";
  try {
    const url = new URL(clientOrigin);
    origin = url.origin;
  } catch (error) {
    console.error("Invalid URL in referer:", clientOrigin);
  }
  const issues = await localApi.getIssues(origin, userToken);
  const data: LoaderData = { userToken, issues };
  return Response.json(data);
};

const Issues = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const user = useOptionalUser();
  const { issues: reqs } = useLoaderData<LoaderData>();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const totalPages = Math.ceil(reqs.length / limit);
  const [issues, setIssues] = useState(reqs.slice(0, limit));
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [formVals, setFormVals] = useState<EditIssue>({
    status: "",
  });

  const handleInputChange = (field: string) => (value: string) => {
    setFormVals((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { toast } = useToast();

  const handleInfoClick = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleEditClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setFormVals({
      status: issue.status,
    });
    setEditing(true);
  };

  const handleRemoveClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setRemoving(true);
  };

  const handleCloseModal = () => {
    setSelectedIssue(null);
    setEditing(false);
    setRemoving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return <Badge className="bg-blue-500">Low</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High</Badge>;
      case "critical":
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge className="bg-yellow-500">{severity}</Badge>;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const index = (page - 1) * limit;
    setIssues(reqs.slice(index, index + limit));
  };

  const handleUpdate = async () => {
    if (!user || !selectedIssue) return;
    try {
      await localApi.updateIssue(user.token, selectedIssue.id, formVals);

      toast({
        title: "Issue Updated",
        description: "The book issue was updated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong updating the book issue.",
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedIssue) {
      return;
    }

    if (selectedIssue.status == "resolved") {
      toast({
        title: "Error",
        description: "You can't remove a issue that's already resolved.",
      });
      return;
    }

    try {
      await localApi.deleteIssue(user.token, selectedIssue.id);

      toast({
        title: "Issue Deleted",
        description:
          "The book issue was removed. Refresh the page to see the changes.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong removing the book issue.",
      });
    }
  };

  const clientOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const absBaseUrl = getEnvVal(import.meta.env.VITE_ABS_URL, clientOrigin);

  return (
    <div className="flex h-screen">
      <Sidebar user={user} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shadow-sm w-full">
          <Toaster />
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
              <Avatar>
                <AvatarFallback>
                  {user?.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-auto p-4">
          <div className="container mx-auto py-10">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Your reported issues</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cover</TableHead>
                    {user?.type === "root" && <TableHead>Creator</TableHead>}
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <img
                          src={absBaseUrl + `/api/items/${issue.book_id}/cover`}
                          alt={`Cover of ${issue.book_title}`}
                          className="w-[50px] h-[75px] object-cover rounded-md"
                        />
                      </TableCell>
                      {user?.type === "root" && (
                        <TableCell className="font-medium">
                          {issue.creator_username}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <a
                          href={`${absBaseUrl}/item/${issue.book_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {issue.book_title}
                        </a>
                      </TableCell>
                      <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInfoClick(issue)}
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">
                            View details for {issue.book_title}
                          </span>
                        </Button>
                        {user?.type === "root" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(issue)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">
                              Edit {issue.book_title}
                            </span>
                          </Button>
                        )}
                        {issue.status !== "resolved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveClick(issue)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">
                              Remove {issue.book_title} issue
                            </span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1)
                            handlePageChange(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            handlePageChange(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            <Dialog
              open={!!selectedIssue && !(editing || removing)}
              onOpenChange={handleCloseModal}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Issue #{selectedIssue?.id}</DialogTitle>
                  <DialogDescription>
                    by {selectedIssue?.creator_username}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Clock className="h-4 w-4" />
                    {selectedIssue && (
                      <div className="col-span-3">
                        <p>
                          <strong>Created:</strong>{" "}
                          {new Date(
                            selectedIssue.created_at
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Updated:</strong>{" "}
                          {new Date(
                            selectedIssue.updated_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleCloseModal}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={!!selectedIssue && (editing || removing)}
              onOpenChange={handleCloseModal}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Editing" : "Removing"} --{" "}
                    {selectedIssue?.book_title}
                  </DialogTitle>
                </DialogHeader>

                {editing ? (
                  <div className="space-y-2">
                    <Label htmlFor="approval">Status</Label>
                    <Select
                      value={formVals.status}
                      onValueChange={handleInputChange("status")}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <p>Are you sure you want to delete this issue?</p>
                  </>
                )}
                <DialogFooter>
                  {editing ? (
                    <Button
                      type="button"
                      className="bg-green-500"
                      onClick={async () => {
                        setIsLoading(true);
                        await handleUpdate();
                        setIsLoading(false);
                        handleCloseModal();
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        "Update"
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="bg-red-500"
                      type="button"
                      onClick={async () => {
                        setIsLoading(true);
                        await handleDelete();
                        setIsLoading(false);
                        handleCloseModal();
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        "Just do it already"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Issues;
