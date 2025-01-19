/* eslint-disable import/no-unresolved */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Props = {
    selectedBook: NewBookRequest | null
    bookDescription: string | null
    handleCloseModal: () => void
    onRequestBook?: (req: NewBookRequest) => Promise<void>
}

const RequestPrompt = (props: Props) => {
  const {selectedBook, handleCloseModal, onRequestBook, bookDescription} = props;
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirmRequest = async () => {
    if (selectedBook && onRequestBook) {
      setIsLoading(true)

      await onRequestBook(selectedBook);

      setIsLoading(false)
    }
    handleCloseModal();
  };

  return (
    <Dialog open={!!selectedBook} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
            <DialogDescription>
              by {selectedBook?.author || "unknown"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="col-span-1">
                {selectedBook?.cover ? (
                  <img
                    src={selectedBook?.cover}
                    alt={`Cover of ${selectedBook?.title}`}
                    className="w-full object-contain rounded-md"
                  />
                ): (
                  <div className="inset-0 w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-sm text-center px-2">
                      No Cover Available
                    </span>
                  </div>
                )}
              </div>
              <div className="col-span-3">
                <p className="text-sm text-gray-500">
                  {bookDescription
                    ? bookDescription.length > 300
                    ? `${bookDescription.slice(0, 300)}...`
                    : bookDescription
                    : "No description available"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmRequest} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Confirm Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}

export default RequestPrompt