"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, ImageIcon } from "lucide-react";
import { BackgroundPicker } from "./background-picker";
import { DatePicker } from "./date-picker";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import type { CoverPhotoInput, Photo } from "@gotrippin/core";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tour,
  TourPortal,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourArrow,
  TourClose,
  TourHeader,
  TourTitle,
  TourDescription,
  TourFooter,
  TourStepCounter,
  TourPrev,
  TourNext,
} from "@/components/ui/tour";

interface CreateTripProps {
  onBack: () => void
  onSave: (data: { 
    title: string; 
    coverPhoto?: CoverPhotoInput;
    color?: string; 
    dateRange?: DateRange;
  }) => Promise<void>
  initialData?: {
    title: string
    initialCoverPhoto?: Photo | null
    color?: string
    dateRange?: DateRange
  }
  isEditing?: boolean
}

export default function CreateTrip({ onBack, onSave, initialData, isEditing = false }: CreateTripProps) {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);
  const hasForcedFromQueryRef = useRef(false);

  // Details State
  const [tripName, setTripName] = useState(initialData?.title || "");
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // New cover photo: selected by user this session (takes precedence over initialCoverPhoto for display)
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState<CoverPhotoInput | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialData?.color || null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialData?.dateRange);
  // Newly selected photo takes precedence; fall back to existing cover photo from R2
  const previewImageUrl = selectedCoverPhoto
    ? selectedCoverPhoto.image_url
    : initialData?.initialCoverPhoto?.storage_key
      ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${initialData.initialCoverPhoto.storage_key}`
      : null;
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) return;

    // Explicit tour query param can force the tour to open once,
    // regardless of whether the user has seen it before.
    if (typeof window !== "undefined" && !hasForcedFromQueryRef.current) {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      if (params.get("tour") === "create_trip_v1") {
        setTourOpen(true);
        hasForcedFromQueryRef.current = true;
        // Clean up the URL so a reload doesn't keep forcing the tour.
        params.delete("tour");
        window.history.replaceState({}, "", url.toString());
        return;
      }
    }

    if (!user) return;

    const uiTours =
      (user.user_metadata?.ui_tours as Record<string, unknown> | undefined) ?? {};
    const hasSeenCreateTripTour = uiTours["create_trip_v1"] === true;

    if (!hasSeenCreateTripTour) {
      setTourOpen(true);
    }
  }, [user, isEditing]);

  const markTourSeen = async () => {
    try {
      const existing =
        ((user?.user_metadata?.ui_tours as Record<string, boolean> | undefined) ?? {});

      const { error } = await supabase.auth.updateUser({
        data: {
          ui_tours: {
            ...existing,
            create_trip_v1: true,
          },
        },
      });

      if (error) {
        console.error("Failed to persist create trip tour flag:", error);
        return;
      }

      void refreshProfile();
    } catch (error) {
      console.error("Unexpected error while persisting create trip tour flag:", error);
    }
  };

  const handleTourOpenChange = (open: boolean) => {
    setTourOpen(open);
    if (!open) {
      void markTourSeen();
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!tripName.trim()) return;
    if (!dateRange?.from || !dateRange?.to) return;

    setSaving(true);
    try {
      await onSave({
        title: tripName,
        coverPhoto: selectedCoverPhoto || undefined,
        color: selectedColor || undefined,
        dateRange,
      });
    } catch (error) {
      console.error("Failed to save trip:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBackgroundSelect = (type: "image", value: CoverPhotoInput) => {
    setSelectedCoverPhoto(value);
    setSelectedColor(null);
    setShowBackgroundPicker(false);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedCoverPhoto(null);
    setShowBackgroundPicker(false);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return t("trips.no_date_set");
    if (!dateRange.to) {
      const month = dateRange.from.toLocaleDateString("en-US", { month: "short" });
      const day = dateRange.from.getDate();
      return `${month} ${day}`;
    }
    const fromMonth = dateRange.from.toLocaleDateString("en-US", { month: "short" });
    const fromDay = dateRange.from.getDate();
    const toMonth = dateRange.to.toLocaleDateString("en-US", { month: "short" });
    const toDay = dateRange.to.getDate();
    return `${fromMonth} ${fromDay} → ${toMonth} ${toDay}`;
  };

  const renderBackground = () => (
    <div className="fixed inset-0 -z-10">
      <AnimatePresence mode="wait">
        {previewImageUrl ? (
          <motion.div
            key="image"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <img
              src={previewImageUrl}
              alt="Trip background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </motion.div>
        ) : selectedColor ? (
          <motion.div
            key="color"
            className="absolute inset-0"
            style={{
              // Avoid mixing `background` shorthand with `backgroundColor` across renders.
              // Use stable `backgroundColor` + `backgroundImage` only.
              backgroundColor: selectedColor.startsWith("linear-gradient")
                ? "#0a0a0a"
                : selectedColor,
              backgroundImage: selectedColor.startsWith("linear-gradient")
                ? selectedColor
                : undefined,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!selectedColor.startsWith('linear-gradient') && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="default"
            className="absolute inset-0"
            style={{
              backgroundColor: "#0a0a0a",
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      {/* Global dark overlay to ensure content is always readable over backgrounds */}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );

  return (
    <>
      <div className="min-h-screen relative overflow-hidden flex flex-col">
        {renderBackground()}

        <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="px-4 py-2 rounded-full text-[#ff6b6b] text-lg font-medium backdrop-blur-md border border-white/20 disabled:opacity-50 hover:bg-white/5 transition-colors"
            disabled={saving}
          >
            {t("trips.cancel")}
          </button>

          {!isEditing && (
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          )}

          <button 
            id="create-trip-next-button"
            onClick={handleSave} 
            className="px-6 py-2 rounded-full bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex items-center gap-2"
            disabled={
              (!tripName.trim()) || 
              (!dateRange?.from || !dateRange?.to) ||
              saving
            }
          >
            {isEditing
              ? saving
                ? t("trips.updating")
                : t("trips.update")
              : saving
                ? t("trips.saving")
                : t("common.next", { defaultValue: "Next" })}
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32">
            <input
              type="text"
              id="create-trip-name-input"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder={t("trips.trip_name")}
              className="w-full bg-transparent border-none text-white text-5xl font-bold placeholder:text-white/40 focus:outline-none text-center mb-4"
              style={{ caretColor: "#ff6b6b" }}
              autoFocus
            />
            <p className="text-white/60 text-lg">{formatDateRange()}</p>
          </div>

          <div className="relative z-10 px-6 pb-12 flex items-center justify-center gap-1">
            <button
              onClick={() => setShowDatePicker(true)}
              id="create-trip-dates-button"
              className="flex-1 flex flex-col items-center gap-2 py-4 text-white/80 hover:text-white transition-colors"
            >
              <CalendarIcon className="w-6 h-6" />
              <span className="text-sm font-medium">{t("trips.set_dates")}</span>
            </button>

            <div className="w-px h-12 bg-white/20" />

            <button
              onClick={() => setShowBackgroundPicker(true)}
              id="create-trip-background-button"
              className="flex-1 flex flex-col items-center gap-2 py-4 text-white/80 hover:text-white transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm font-medium">{t("trips.background")}</span>
            </button>
          </div>
        </div>
      </div>

      <BackgroundPicker
        open={showBackgroundPicker}
        onClose={() => setShowBackgroundPicker(false)}
        onSelect={handleBackgroundSelect}
        onSelectColor={handleColorSelect}
        defaultSearchQuery={tripName}
      />
      
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={setDateRange}
        selectedDateRange={dateRange}
      />

      {!isEditing && (
        <Tour
          open={tourOpen}
          onOpenChange={handleTourOpenChange}
          defaultValue={0}
          alignOffset={0}
          sideOffset={16}
          spotlightPadding={8}
          stepFooter={
            <TourFooter>
              <div className="flex w-full items-center justify-between">
                <TourStepCounter className="text-xs text-muted-foreground" />
                <div className="flex gap-2">
                  <TourPrev
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  />
                  <TourNext
                    size="sm"
                    className="h-8 px-4 text-xs"
                  />
                </div>
              </div>
            </TourFooter>
          }
        >
          <TourPortal>
            <TourSpotlight />
            <TourSpotlightRing className="rounded-2xl border-2 border-primary shadow-[0_0_30px_rgba(255,107,107,0.45)]" />

            <TourStep target="#create-trip-name-input" side="bottom">
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>{t("trips.trip_name")}</TourTitle>
                <TourDescription>
                  {t("trips.create_tour_name_body", {
                    defaultValue: "Give your trip a short, memorable name. You can change it later.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#create-trip-dates-button" side="top">
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>{t("trips.set_dates")}</TourTitle>
                <TourDescription>
                  {t("date_picker.select_range", {
                    defaultValue: "Pick the start and end dates for this adventure.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#create-trip-background-button" side="top">
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>{t("trips.background")}</TourTitle>
                <TourDescription>
                  {t("background_picker.title", {
                    defaultValue: "Choose a cover image or color that matches your route.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#create-trip-next-button" side="bottom" forceMount>
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>
                  {t("trips.create_tour_map_title", {
                    defaultValue: "Continue to the map",
                  })}
                </TourTitle>
                <TourDescription>
                  {t("trip_overview.route_map_title", {
                    defaultValue: "After this step you’ll sketch your route on the map.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>
          </TourPortal>
        </Tour>
      )}
    </>
  );
}
