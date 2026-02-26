"use client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHero() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-4 p-6 border-b">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 p-6 border-b bg-card">
      <Image
        src={user.imageUrl}
        alt={user.fullName || "User"}
        width={64}
        height={64}
        className="size-16 rounded-full object-cover border bg-muted"
      />
      <div>
        <h2 className="text-xl font-semibold">{user.fullName}</h2>
        <p className="text-sm text-muted-foreground">
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>
    </div>
  );
}
