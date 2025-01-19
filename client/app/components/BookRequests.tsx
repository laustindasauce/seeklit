/* eslint-disable import/no-unresolved */
import { useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Book, Download, Info } from 'lucide-react'

type BookRequest = {
    id: number;
    title: string;
    author: string;
    source: string;
    source_id: string;
    isbn_10: string | null;
    isbn_13: string | null;
    cover: string | null;
    approval_status: string;
    download_status: string;
    requestor_id: string;
    requestor_username: string;
}

// Mock data for demonstration
const mockRequests: BookRequest[] = [
    {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        source: "Google Books",
        source_id: "ABC123",
        isbn_10: "0743273567",
        isbn_13: "9780743273565",
        cover: "https://example.com/great-gatsby-cover.jpg",
        approval_status: "Approved",
        download_status: "Ready",
        requestor_id: "user1",
        requestor_username: "johndoe"
    },
    {
        id: 2,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        source: "Open Library",
        source_id: "DEF456",
        isbn_10: null,
        isbn_13: "9780446310789",
        cover: null,
        approval_status: "Pending",
        download_status: "Not Available",
        requestor_id: "user1",
        requestor_username: "johndoe"
    },
    // Add more mock data as needed
]

const BookRequests = () => {
    const [requests] = useState<BookRequest[]>(mockRequests)
    const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(null)

    const handleInfoClick = (request: BookRequest) => {
        setSelectedRequest(request)
    }

    const handleCloseModal = () => {
        setSelectedRequest(null)
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return <Badge className="bg-green-500">Approved</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500">Pending</Badge>
            case 'rejected':
                return <Badge className="bg-red-500">Rejected</Badge>
            default:
                return <Badge className="bg-gray-500">{status}</Badge>
        }
    }

    const getDownloadStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ready':
                return <Badge className="bg-blue-500">Ready</Badge>
            case 'not available':
                return <Badge className="bg-gray-500">Not Available</Badge>
            default:
                return <Badge className="bg-gray-500">{status}</Badge>
        }
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-5">Your Book Requests</h1>
            <ScrollArea className="h-[calc(100vh-200px)]">
                <Table>
                    <TableCaption>A list of your recent book requests</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Approval Status</TableHead>
                            <TableHead>Download Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.title}</TableCell>
                                <TableCell>{request.author}</TableCell>
                                <TableCell>{request.source}</TableCell>
                                <TableCell>{getStatusBadge(request.approval_status)}</TableCell>
                                <TableCell>{getDownloadStatusBadge(request.download_status)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleInfoClick(request)}>
                                        <Info className="h-4 w-4" />
                                        <span className="sr-only">View details for {request.title}</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>

            <Dialog open={!!selectedRequest} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedRequest?.title}</DialogTitle>
                        <DialogDescription>by {selectedRequest?.author}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Book className="h-4 w-4" />
                            <div className="col-span-3">
                                <p><strong>Source:</strong> {selectedRequest?.source}</p>
                                <p><strong>Source ID:</strong> {selectedRequest?.source_id}</p>
                            </div>
                        </div>
                        {selectedRequest?.isbn_10 && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Info className="h-4 w-4" />
                                <div className="col-span-3">
                                    <p><strong>ISBN-10:</strong> {selectedRequest.isbn_10}</p>
                                </div>
                            </div>
                        )}
                        {selectedRequest?.isbn_13 && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Info className="h-4 w-4" />
                                <div className="col-span-3">
                                    <p><strong>ISBN-13:</strong> {selectedRequest.isbn_13}</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Download className="h-4 w-4" />
                            <div className="col-span-3">
                                <p><strong>Approval Status:</strong> {selectedRequest?.approval_status}</p>
                                <p><strong>Download Status:</strong> {selectedRequest?.download_status}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleCloseModal}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default BookRequests;