"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const logout = async () => {
    setPending(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      if (!response.ok) throw new Error("logout_failed");
      window.location.replace("/");
    } catch {
      toast.error("Não foi possível sair. Tente novamente.");
      setPending(false);
    }
  };
  return <Button type="button" size="sm" variant="outline" onClick={logout} disabled={pending}>Sair</Button>;
}
