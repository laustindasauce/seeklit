/* eslint-disable import/no-unresolved */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CircleHelp, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type Props = {
  newIssue: NewIssue;
  handleCloseModal: () => void;
  onSubmitIssue?: (issue: NewIssue) => Promise<void>;
  absBaseUrl: string;
};

const IssuePrompt = (props: Props) => {
  const { newIssue, handleCloseModal, onSubmitIssue, absBaseUrl } = props;
  const [isLoading, setIsLoading] = React.useState(false);
  const [formVals, setFormVals] = React.useState<NewIssue>(newIssue);

  const handleSubmitIssue = async () => {
    if (newIssue && onSubmitIssue) {
      setIsLoading(true);

      await onSubmitIssue(newIssue);

      setIsLoading(false);
    }
    handleCloseModal();
  };

  return (
    <Dialog open={!!newIssue} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{newIssue?.book_title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="col-span-1">
              <img
                src={absBaseUrl + `/api/items/${newIssue?.book_id}/cover`}
                alt={`Cover of ${newIssue?.book_title}`}
                className="w-full object-contain rounded-md"
              />
            </div>
            <div className="col-span-3">
              <div className="space-y-2">
                <Label htmlFor="severity" className="flex">
                  {/* <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild></TooltipTrigger>
                      <TooltipContent></TooltipContent>
                    </Tooltip>
                  </TooltipProvider> */}
                  Severity{"  "}
                  <Popover>
                    <PopoverTrigger>
                      <CircleHelp className="w-4 h-4 text-gray-500 ml-2" />
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <div>
                        <div className="font-bold">Low</div>
                        <p className="text-gray-400">
                          Minor issues, such as a single typo or a formatting
                          inconsistency.
                        </p>
                      </div>
                      <div className="mt-2">
                        <div className="font-bold">Medium</div>
                        <p className="text-gray-400">
                          Moderate issues that affect readability but not
                          functionality, like poorly formatted chapters or
                          missing metadata.
                        </p>
                      </div>
                      <div className="mt-2">
                        <div className="font-bold">High</div>
                        <p className="text-gray-400">
                          Significant issues that impact usability, such as
                          chapters out of order or unreadable text.
                        </p>
                      </div>
                      <div className="mt-2">
                        <div className="font-bold">Critical</div>
                        <p className="text-gray-400">
                          Issues that render the ebook completely unusable, like
                          a corrupted file or an inaccessible link.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Label>
                <Select
                  value={formVals.severity}
                  onValueChange={(
                    val: "low" | "medium" | "high" | "critical"
                  ) => setFormVals({ ...formVals, severity: val })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="approval">Description</Label>
                <Textarea
                  value={formVals.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormVals({ ...formVals, description: e.target.value })
                  }
                  placeholder="Describe the issue experienced..."
                  maxLength={255}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmitIssue}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Submit Issue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IssuePrompt;
