"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, ImageIcon } from "lucide-react";
import { BackgroundPicker } from "./background-picker";
import { DatePicker, type DatePickerTimelineContext } from "./date-picker";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import type { CoverPhotoInput, Photo } from "@gotrippin/core";
import { getR2PublicUrl } from "@/lib/r2-public";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreateTripProps {
  onBack: () => void
  onSave: (data: {
    title: string;
    coverPhoto?: CoverPhotoInput;
    /** R2 key after device upload; backend creates `photos` row with source=upload. */
    coverUploadStorageKey?: string;
    color?: string;
    dateRange?: DateRange;
  }) => Promise<void>;
  initialData?: {
    title: string
    initialCoverPhoto?: Photo | null
    color?: string
    dateRange?: DateRange
  }
  isEditing?: boolean
  /** When editing, show route/activity dots on the trip date picker (same as trip overview). */
  datePickerTimelineContext?: DatePickerTimelineContext
}

export default function CreateTrip({
  onBack,
  onSave,
  initialData,
  isEditing = false,
  datePickerTimelineContext,
}: CreateTripProps) {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);
  const hasForcedFromQueryRef = useRef(false);
  const tripNameInputRef = useRef<HTMLTextAreaElement>(null);

  // Details State
  const [tripName, setTripName] = useState(initialData?.title || "");
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBackgroundNudge, setShowBackgroundNudge] = useState(false);
  // New cover photo: selected by user this session (takes precedence over initialCoverPhoto for display)
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState<CoverPhotoInput | null>(null);
  const [selectedCoverUploadKey, setSelectedCoverUploadKey] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialData?.color || null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialData?.dateRange);
  const initialCoverFromR2 =
    initialData?.initialCoverPhoto?.storage_key != null
      ? getR2PublicUrl(initialData.initialCoverPhoto.storage_key)
      : null;
  // Upload key or Unsplash preview or existing cover from DB
  const previewImageUrl = selectedCoverUploadKey
    ? getR2PublicUrl(selectedCoverUploadKey)
    : selectedCoverPhoto
      ? selectedCoverPhoto.image_url
      : initialCoverFromR2;

  /** Full-bleed cover image or chosen color — use light text + scrim. Otherwise show page aurora + theme text. */
  const immersiveChrome = Boolean(previewImageUrl || selectedColor);

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

  useLayoutEffect(() => {
    const el = tripNameInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [tripName]);

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

  const hasChosenBackground = Boolean(previewImageUrl || selectedColor);

  const completeStep = async () => {
    if (!tripName.trim()) return;
    if (!dateRange?.from || !dateRange?.to) return;

    setSaving(true);
    try {
      await onSave({
        title: tripName,
        coverPhoto: selectedCoverPhoto || undefined,
        coverUploadStorageKey: selectedCoverUploadKey || undefined,
        color: selectedColor || undefined,
        dateRange,
      });
    } catch (error) {
      console.error("Failed to save trip:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleNextClick = () => {
    if (!tripName.trim() || !dateRange?.from || !dateRange?.to || saving) return;
    if (!isEditing && !hasChosenBackground) {
      setShowBackgroundNudge(true);
      return;
    }
    void completeStep();
  };

  const handleBackgroundSelect = (type: "image", value: CoverPhotoInput) => {
    setSelectedCoverPhoto(value);
    setSelectedCoverUploadKey(null);
    setSelectedColor(null);
    setShowBackgroundPicker(false);
  };

  const handleCoverUploadSelect = (payload: { storage_key: string }) => {
    setSelectedCoverUploadKey(payload.storage_key);
    setSelectedCoverPhoto(null);
    setSelectedColor(null);
    setShowBackgroundPicker(false);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedCoverPhoto(null);
    setSelectedCoverUploadKey(null);
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

  const renderBackground = () => {
    if (!immersiveChrome) {
      return null;
    }
    return (
      <div className="pointer-events-none absolute inset-0 z-0">
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
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/65 dark:from-black/60 dark:via-black/40 dark:to-black/80" />
            </motion.div>
          ) : selectedColor ? (
            <motion.div
              key="color"
              className="absolute inset-0"
              style={{
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
              {!selectedColor.startsWith("linear-gradient") && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/40 dark:from-black/40 dark:via-black/20 dark:to-black/60" />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/35 dark:bg-black/55" />
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen relative overflow-hidden flex flex-col">
        {renderBackground()}

        <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "rounded-full px-4 py-2 text-lg font-medium transition-colors disabled:opacity-50",
              immersiveChrome
                ? "border border-white/20 text-[#ff7670] backdrop-blur-md hover:bg-white/5"
                : "border border-border bg-background/70 text-primary backdrop-blur-md hover:bg-muted/90 dark:border-white/20 dark:bg-background/40 dark:hover:bg-white/10",
            )}
            disabled={saving}
          >
            {t("trips.cancel")}
          </button>

          {!isEditing && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                immersiveChrome
                  ? "bg-white/10 text-white/90"
                  : "bg-muted/90 text-foreground dark:bg-white/10 dark:text-white/90",
              )}
            >
              <span className={immersiveChrome ? "text-white" : "text-foreground dark:text-white"}>1</span>
              <span className={immersiveChrome ? "text-white/40" : "text-muted-foreground"}>/</span>
              <span className={immersiveChrome ? "text-white/50" : "text-muted-foreground"}>2</span>
            </span>
          )}

          <button
            type="button"
            id="create-trip-next-button"
            onClick={handleNextClick}
            className={cn(
              "flex items-center gap-2 rounded-full px-6 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              immersiveChrome
                ? "bg-white text-black hover:bg-white/90"
                : "bg-primary text-primary-foreground hover:brightness-[0.96] active:brightness-[0.92]",
            )}
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
          <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center justify-center px-6 pb-32">
            <textarea
              ref={tripNameInputRef}
              id="create-trip-name-input"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder={t("trips.trip_name")}
              rows={1}
              spellCheck={true}
              className={cn(
                "mb-4 w-full max-w-full min-w-0 resize-none overflow-hidden border-none bg-transparent text-center text-5xl font-bold leading-tight tracking-tight break-words [overflow-wrap:anywhere] focus:outline-none focus:ring-0",
                immersiveChrome
                  ? "text-white placeholder:text-white/40"
                  : "text-foreground placeholder:text-muted-foreground",
              )}
              style={{ caretColor: "#ff7670" }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className={cn(
                "-mx-1 rounded-md px-1 text-lg transition-colors focus-visible:outline-none focus-visible:ring-2",
                immersiveChrome
                  ? "text-white/60 hover:text-white/85 focus-visible:text-white/90 focus-visible:ring-white/40"
                  : "text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:ring-ring/60",
              )}
              aria-label={t("trips.set_dates")}
            >
              {formatDateRange()}
            </button>
          </div>

          <div className="relative z-10 px-6 pb-12 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              id="create-trip-dates-button"
              className={cn(
                "flex flex-1 flex-col items-center gap-2 py-4 transition-colors",
                immersiveChrome
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarIcon className="h-6 w-6" />
              <span className="text-sm font-medium">{t("trips.set_dates")}</span>
            </button>

            <div
              className={cn("h-12 w-px", immersiveChrome ? "bg-white/20" : "bg-border dark:bg-white/20")}
            />

            <button
              type="button"
              onClick={() => setShowBackgroundPicker(true)}
              id="create-trip-background-button"
              className={cn(
                "flex flex-1 flex-col items-center gap-2 py-4 transition-colors",
                immersiveChrome
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
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
        onSelectUpload={handleCoverUploadSelect}
        defaultSearchQuery={tripName}
      />
      
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={setDateRange}
        selectedDateRange={dateRange}
        timelineContext={datePickerTimelineContext}
      />

      <Dialog open={showBackgroundNudge} onOpenChange={setShowBackgroundNudge}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("trips.create_background_nudge_title", {
                defaultValue: "Add a trip background?",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("trips.create_background_nudge_description", {
                defaultValue:
                  "Pick a cover photo or color, or skip — we will use a default style on your map.",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBackgroundNudge(false);
                void completeStep();
              }}
            >
              {t("trips.create_background_nudge_no", { defaultValue: "Skip for now" })}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowBackgroundNudge(false);
                setShowBackgroundPicker(true);
              }}
            >
              {t("trips.create_background_nudge_yes", { defaultValue: "Choose background" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <TourSpotlightRing className="rounded-2xl border-2 border-primary shadow-[0_0_30px_rgba(255, 118, 112,0.45)]" />

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
