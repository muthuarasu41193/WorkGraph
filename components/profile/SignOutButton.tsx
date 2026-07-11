"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutClient } from "../../lib/auth/client";

export default function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await signOutClient();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className={iconClass()} aria-hidden />
      {isLoading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
