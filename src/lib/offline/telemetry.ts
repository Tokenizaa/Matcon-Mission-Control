import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { emitEvent, type EventType } from "./events";

export function useTelemetry(pageName: string) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      emitEvent(user.id, "customers", user.id, "inventory_updated", { page: pageName, type: 'view' });
    }
  }, [user, pageName]);
}
