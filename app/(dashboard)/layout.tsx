"use client";

import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LocationsSidebar } from "@/components/dashboard/sidebar";
import { useMapsStore } from "@/store/maps-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchInitialData = useMapsStore((s) => s.fetchInitialData);

  useEffect(() => {
    // Clear legacy mock-data cache from localStorage if present
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("nestpick-store-v1");
        localStorage.removeItem("nestpick-maps-storage");
      } catch (e) {
        console.error("Failed to clear legacy store cache:", e);
      }
    }
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <SidebarProvider>
      <LocationsSidebar />
      <SidebarInset className="overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
