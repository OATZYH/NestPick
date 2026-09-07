"use client";

import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LocationsSidebar } from "@/components/dashboard/sidebar";
import { ListingModal } from "@/components/dashboard/listing-modal";
import { CenterPointModal } from "@/components/dashboard/center-point-modal";
import { useMapsStore } from "@/store/maps-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchInitialData = useMapsStore((s) => s.fetchInitialData);
  const isListingModalOpen = useMapsStore((s) => s.isListingModalOpen);
  const setIsListingModalOpen = useMapsStore((s) => s.setIsListingModalOpen);
  const isCenterPointModalOpen = useMapsStore((s) => s.isCenterPointModalOpen);
  const setIsCenterPointModalOpen = useMapsStore((s) => s.setIsCenterPointModalOpen);
  const editingListing = useMapsStore((s) => s.editingListing);

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

      {/* Centralized Listing Create/Edit Modal */}
      <ListingModal
        open={isListingModalOpen}
        onOpenChange={setIsListingModalOpen}
        initialListing={editingListing}
      />

      {/* Centralized Reference Center Point Modal */}
      <CenterPointModal
        open={isCenterPointModalOpen}
        onOpenChange={setIsCenterPointModalOpen}
      />
    </SidebarProvider>
  );
}
