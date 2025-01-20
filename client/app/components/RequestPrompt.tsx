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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useOptionalUser } from "@/utils";
import { Label } from "./ui/label";

type Props = {
  selectedBook: NewBookRequest | null;
  bookDescription: string | null;
  handleCloseModal: () => void;
  onRequestBook?: (req: NewBookRequest) => Promise<void>;
  users: User[];
};

const RequestPrompt = (props: Props) => {
  const {
    selectedBook,
    handleCloseModal,
    onRequestBook,
    bookDescription,
    users,
  } = props;
  const user = useOptionalUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [requestAs, setRequestAs] = React.useState<{
    username: string;
    id: string;
  }>({ username: "", id: "" });

  React.useEffect(() => {
    if (user) {
      setRequestAs({ id: user.id, username: user.username });
    }
  }, [user]);

  const handleConfirmRequest = async () => {
    if (selectedBook && onRequestBook) {
      setIsLoading(true);

      selectedBook.requestor_id = requestAs.id;
      selectedBook.requestor_username = requestAs.username;

      await onRequestBook(selectedBook);

      setIsLoading(false);
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
              ) : (
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
          {(user?.type === "admin" || user?.type === "root") && (
            <div className="space-y-2">
              <Label htmlFor="approval">Request as</Label>
              <Select
                value={requestAs.id}
                onValueChange={(val: string) => {
                  const selectedUser = users?.find((user) => user.id === val);
                  if (selectedUser) {
                    setRequestAs({
                      id: selectedUser.id,
                      username: selectedUser.username,
                    });
                  }
                }}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmRequest}
            disabled={isLoading}
          >
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
  );
};

export default RequestPrompt;
