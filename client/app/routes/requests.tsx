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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Book,
  Clock,
  Download,
  Edit,
  Info,
  Loader2Icon,
  Menu,
  Trash,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// Define the data type for the loader
type LoaderData = {
  userToken: string;
  requests: BookRequest[];
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
  const requests = await localApi.getRequests(userToken);
  const data: LoaderData = { userToken, requests };
  return Response.json(data);
};

const BookRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(
    null
  );
  const user = useOptionalUser();
  const { requests: reqs } = useLoaderData<LoaderData>();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const totalPages = Math.ceil(reqs.length / limit);
  const [requests, setRequests] = useState(reqs.slice(0, limit));
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [formVals, setFormVals] = useState<EditBookRequest>({
    approval_status: "",
    download_status: "",
    download_source: null,
  });

  const handleInputChange = (field: string) => (value: string) => {
    setFormVals((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { toast } = useToast();

  const handleInfoClick = (request: BookRequest) => {
    setSelectedRequest(request);
  };

  const handleEditClick = (request: BookRequest) => {
    setSelectedRequest(request);
    setFormVals({
      approval_status: request.approval_status,
      download_status: request.download_status,
      download_source: request.download_source,
    });
    setEditing(true);
  };

  const handleRemoveClick = (request: BookRequest) => {
    setSelectedRequest(request);
    setRemoving(true);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setEditing(false);
    setRemoving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "denied":
        return <Badge className="bg-red-500">Denied</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getDownloadStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-blue-500">Pending</Badge>;
      case "complete":
        return <Badge className="bg-green-500">Complete</Badge>;
      case "cancelled":
        return <Badge className="bg-orange-500">Cancelled</Badge>;
      case "failure":
        return <Badge className="bg-red-500">Not found</Badge>;
      default:
        return <Badge className="bg-yellow-500">In Progress</Badge>;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const index = (page - 1) * limit;
    setRequests(reqs.slice(index, index + limit));
  };

  const handleUpdate = async () => {
    if (!user || !selectedRequest) return;
    try {
      await localApi.updateRequest(user.token, selectedRequest.id, formVals);

      toast({
        title: "Request Updated",
        description: "The book request was updated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong updating the book request.",
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedRequest) {
      return;
    }

    if (selectedRequest.download_status == "complete") {
      toast({
        title: "Error",
        description: "You can't remove a request that's already complete.",
      });
      return;
    }

    try {
      await localApi.deleteRequest(user.token, selectedRequest.id);

      toast({
        title: "Request Deleted",
        description:
          "The book request was removed. Refresh the page to see the changes.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong removing the book request.",
      });
    }
  };

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
              <Table className="mb-4">
                <TableCaption>Your book requests</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cover</TableHead>
                    {user?.type === "root" && <TableHead>Requestor</TableHead>}
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Approval Status</TableHead>
                    <TableHead>Download Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.cover ? (
                          <img
                            src={request.cover}
                            alt={`Cover of ${request.title}`}
                            className="w-[50px] h-[75px] object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-[50px] h-[75px] bg-gray-200 flex items-center justify-center rounded-md">
                            <Book className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      {user?.type === "root" && (
                        <TableCell className="font-medium">
                          {request.requestor_username}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {request.title}
                      </TableCell>
                      <TableCell>{request.author}</TableCell>
                      <TableCell>
                        {getStatusBadge(request.approval_status)}
                      </TableCell>
                      <TableCell>
                        {getDownloadStatusBadge(request.download_status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInfoClick(request)}
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">
                            View details for {request.title}
                          </span>
                        </Button>
                        {user?.type === "root" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(request)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">
                              Edit {request.title}
                            </span>
                          </Button>
                        )}
                        {request.download_status !== "complete" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveClick(request)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">
                              Remove {request.title}
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
            {/* </ScrollArea> */}

            <Dialog
              open={!!selectedRequest && !(editing || removing)}
              onOpenChange={handleCloseModal}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request #{selectedRequest?.id}</DialogTitle>
                  <DialogDescription>
                    by {selectedRequest?.author}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Book className="h-4 w-4" />
                    <div className="col-span-3">
                      <p>
                        <strong>Source:</strong> {selectedRequest?.source}
                      </p>
                      <p>
                        <strong>Source ID:</strong> {selectedRequest?.source_id}
                      </p>
                    </div>
                  </div>
                  {selectedRequest?.isbn_10 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Info className="h-4 w-4" />
                      <div className="col-span-3">
                        <p>
                          <strong>ISBN-10:</strong> {selectedRequest.isbn_10}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedRequest?.isbn_13 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Info className="h-4 w-4" />
                      <div className="col-span-3">
                        <p>
                          <strong>ISBN-13:</strong> {selectedRequest.isbn_13}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedRequest && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Clock className="h-4 w-4" />
                      <div className="col-span-3">
                        <p>
                          <strong>Created:</strong>{" "}
                          {new Date(
                            selectedRequest?.created_at
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Updated:</strong>{" "}
                          {new Date(
                            selectedRequest?.updated_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Download className="h-4 w-4" />
                    <div className="col-span-3">
                      <p>
                        <strong>Approval Status:</strong>{" "}
                        {selectedRequest?.approval_status}
                      </p>
                      <p>
                        <strong>Download Status:</strong>{" "}
                        {selectedRequest?.download_status}
                      </p>
                      {user?.type === "root" &&
                        selectedRequest?.download_status === "complete" && (
                          <p>
                            <strong>Download Source:</strong>{" "}
                            {selectedRequest.download_source || "manual"}
                          </p>
                        )}
                    </div>
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
              open={!!selectedRequest && (editing || removing)}
              onOpenChange={handleCloseModal}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Editing" : "Removing"} -- Request #
                    {selectedRequest?.id}
                  </DialogTitle>
                  <DialogDescription>
                    by {selectedRequest?.author}
                  </DialogDescription>
                </DialogHeader>

                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="approval">Approval</Label>
                      <Select
                        value={formVals.approval_status}
                        onValueChange={handleInputChange("approval_status")}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approval">Download Status</Label>
                      <Select
                        value={formVals.download_status}
                        onValueChange={handleInputChange("download_status")}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failure">Failure</SelectItem>
                          {selectedRequest?.approval_status.startsWith(
                            "in"
                          ) && (
                            <SelectItem
                              value={selectedRequest?.approval_status || "null"}
                            >
                              In Progress
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approval">Download Source</Label>
                      <Input
                        value={formVals?.download_source || ""}
                        placeholder="Where the book was downloaded..."
                        onChange={(e) =>
                          setFormVals({
                            ...formVals,
                            download_source: e.target.value || null,
                          })
                        }
                        disabled={formVals.download_status !== "complete"}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p>Are you sure you want to delete this request?</p>
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

export default BookRequests;
