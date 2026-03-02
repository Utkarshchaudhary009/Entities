import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-3xl mx-auto md:p-6">
      <div className="bg-background md:bg-card md:border md:rounded-2xl overflow-hidden md:shadow-sm">
        {children}
      </div>
    </div>
  );
}
