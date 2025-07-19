import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: User | undefined;
  className?: string;
}

const UserAvatar = ({ user, className = "" }: UserAvatarProps) => {
  if (!user) return null;

  return (
    <a href="/settings" className={`cursor-pointer ${className}`}>
      <Avatar className="hover:ring-2 hover:ring-gray-400 transition-all">
        <AvatarFallback>
          {user.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </a>
  );
};

export default UserAvatar;
