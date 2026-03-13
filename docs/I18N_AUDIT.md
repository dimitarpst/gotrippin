# i18n audit — hardcoded strings and missing translations

Scan date: 2025-03-05. Goal: find user-facing English text that was hardcoded instead of using `t()` from `common.json`.

## Summary

- **Translation files:** `apps/web/src/i18n/locales/en/common.json` (and `bg/common.json`). Keys are namespaced: `app.*`, `auth.*`, `profile.*`, `trips.*`, `trip_overview.*`, `ai.*`, `common.*`, `activity.*`, `train_route.*`, `ui.*`, etc.
- **New namespaces added:** `common`, `activity`, `train_route`, `ui`, plus many new keys under existing namespaces.

## Changes made

### 1. New keys in `en/common.json`

- **common:** error_title, error_description, page_error_title, page_error_description, retry, retry_failed, back, next, previous, cancel, clear, close, loading, error_occurred.
- **ai:** title, placeholder, placeholder_edit, placeholder_sessions, edit_message_title, back_to_chats, back_to_trips, edit_message, stop_generating, find_images, create_trip, just_chat, recent_chats, new_chat, no_chats_yet, creating, start_new_conversation, loading_more, rename_chat, delete_chat, delete_chat_confirm, failed_* (load_chat, request, rename_chat, delete_chat), session_not_found, online_ready.
- **trips:** search_placeholder, route_step_label, create_failed, update_success, update_failed, delete_success, delete_failed, dates_updated, dates_update_failed, background_updated, background_update_failed, color_updated, color_update_failed, trip_destination_alt, trip_background_alt, travel_photo_alt, trip_cover_option_alt, profile_avatar_alt.
- **auth:** invalid_reset_link, password_min_length, failed_reset_password.
- **profile:** save_success, save_failed, avatar_select_image, avatar_file_size, upload_failed, update_password_heading, session_refresh_failed, session_refresh_failed_description, failed_update_email.
- **trip_overview:** route_along_label, route_dropped_pin, route_along_food, route_along_sights, route_along_stays, route_along_all, route_along_empty, route_your_route, route_set_first_stop, route_add_destinations_order, route_set_starting_point, route_add_destination, route_trip_start, route_one_stop, route_stops_count, route_enter_location_name, no_activities_stop.
- **activity:** new_activity, pick_a_date, search_placeholder, cancel, accommodation_placeholder, airport_origin_placeholder, airport_dest_placeholder, airline_placeholder, room_placeholder, cuisine_placeholder, address_placeholder, pnr_placeholder, website_placeholder, notes_placeholder, please_select_route_stop, title_required, auth_required, activity_updated, activity_created, failed_save_activity, delete_confirm, activity_deleted, failed_delete_activity.
- **train_route:** no_route_yet, attach_to_stop, route_name_placeholder, transport_number_placeholder, company_name_placeholder, write_note, take_photo, select_stop_before_save, auth_required, saved_to_timeline, train_route, failed_save.
- **ui:** loading_aria, close_tour, previous_step, next_step, skip_tour, application_dock, panel_content, sortable_cancel_hint.

### 2. Components updated to use `t()`

- **activity-form.tsx:** All toasts, confirm dialog, placeholders, “Pick a date”, Cancel/Save button text.
- **activity-selector.tsx:** “New Activity”, Cancel button, search placeholder.
- **train-route-form.tsx:** “No route yet”, “Attach to stop”, placeholders, “Write a note”, “Take a Photo”, error/status messages, toasts.
- **route-builder.tsx:** “Your route”, helper text, “Set starting point”, “Add destination”, “Trip start”, stop count label.
- **location-card.tsx:** “Enter location name”, “Set dates” (via `trips.set_dates`).
- **AiTestClient.tsx:** “GO AI”, “Online & ready”, placeholders, aria-labels, “Find images” / “Create a trip” / “Just chat”, error messages.
- **AiSessionsListClient.tsx:** “New chat”, “Recent chats”, “No chats yet…”, “Creating…”, “Start a new conversation”, placeholder, aria-labels, confirm and error messages.
- **TripDetailPageClient.tsx:** All toasts (delete, dates, background, color).
- **ResetPasswordPageClient.tsx:** All setError messages (invalid link, password length, passwords match, failed reset).

## Not changed (intentionally or follow-up)

- **activity-selector.tsx:** Category and activity labels (“Flights”, “Lodging”, “Restaurant”, “Food & Drink”, etc.) are still hardcoded. Can be moved to `activity.*` or a new `activity_types` section later.
- **Console logs:** `console.error` / `console.warn` messages were left in English (developer-facing).
- **UI primitives:** `spinner.tsx` (aria-label “Loading”), `drawer.tsx` (sr-only “Panel content”), `tour.tsx` (Close tour, Previous/Next step, Skip tour), `Dock.tsx` (Application dock) — keys exist in `ui.*`; components can be switched to `t("ui.*")` in a follow-up.
- **page-error.tsx:** Already uses `t("common.error_title", { defaultValue: "..." })`; keys now exist in `common`.
- **trip-filters.tsx:** Uses `t('trips.search_placeholder', 'Search trips...')`; key added.
- **MapPageClient “Stops”:** The “N Stops · Tap to edit” line still uses the word “Stops” in one place; can use a new key if needed.

## Bulgarian (bg/common.json)

New keys were added only to **en** in this pass. BG will fall back to English for missing keys (`fallbackLng`). For a full BG experience, add the same keys to `locales/bg/common.json` with Bulgarian translations.

## How to find more hardcoded strings

- Grep for `placeholder="[A-Za-z]`, `aria-label="`, `title="`, and visible button/label text in `apps/web` (excluding `node_modules`, `.next`).
- Prefer one key per phrase; use `{{count}}` or `{{name}}` where interpolation is needed.
