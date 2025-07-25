import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserAvatarProps {
  user: User | undefined;
  className?: string;
}

const UserAvatar = ({ user, className = "" }: UserAvatarProps) => {
  if (!user) return null;

  return (
    <a href="/settings" className={className}>
      <Button variant="ghost" size="icon">
        <Settings className="h-5 w-5" />
      </Button>
    </a>
  );
};

export default UserAvatar;
