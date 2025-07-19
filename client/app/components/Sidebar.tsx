/* eslint-disable import/no-unresolved */
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Settings,
  HelpCircle,
  SquareLibrary,
  BadgeAlert,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | undefined;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`fixed inset-y-0 left-0 z-50 w-48 bg-background border-r border-gray-600 shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:w-48`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-2xl font-bold">
            <a href="/">SeekLit</a>
          </h2>
        </div>
        <nav className="flex-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/">
              <Search className="mr-2 h-4 w-4" /> Seek
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/requests">
              <SquareLibrary className="mr-2 h-4 w-4" /> Requests
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/issues">
              <BadgeAlert className="mr-2 h-4 w-4" /> Issues
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/settings">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/help">
              <HelpCircle className="mr-2 h-4 w-4" /> Help
            </a>
          </Button>
          {/* {user?.type === "root" && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin">
                <ShieldEllipsis className="mr-2 h-4 w-4" /> Administration
              </a>
            </Button>
          )} */}
        </nav>
        <div className="p-4 text-sm text-gray-500">
          Version: {import.meta.env.VITE_SEEKLIT_VERSION}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
