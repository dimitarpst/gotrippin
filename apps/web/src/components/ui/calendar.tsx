"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-transparent p-3 w-full",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "relative flex w-full flex-col gap-6 sm:gap-6 md:flex-row md:gap-4",
          defaultClassNames.months
        ),
        month: cn(
          "isolate flex w-full min-w-0 shrink-0 flex-col gap-4",
          defaultClassNames.month
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-center",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-7 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium text-sm",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse space-y-1",
        weekdays: cn(
          "grid w-full grid-cols-7",
          defaultClassNames.weekdays
        ),
        weekday: cn(
          "text-muted-foreground flex items-center justify-center select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 grid w-full grid-cols-7", defaultClassNames.week),
        week_number_header: cn(
          "w-9 select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative flex aspect-square min-h-0 w-full min-w-0 select-none items-center justify-center p-0 text-center",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "rounded-md bg-transparent text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/60 opacity-50",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isToday = modifiers.today && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
  const mods = modifiers as Record<string, unknown>
  const isBusy =
    !!mods.busy &&
    !modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle

  const isTripBoundary =
    !!(mods.tripStart || mods.tripEnd) &&
    !modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle

  /** Selectable days inside trip min/max (route date picker) — subtle tile so they read at a glance. */
  const isTripWindow =
    !!mods.tripWindow &&
    !modifiers.disabled &&
    !modifiers.outside &&
    !modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle

  const inRange =
    modifiers.range_start || modifiers.range_end || modifiers.range_middle
  const rangeSingleDay =
    Boolean(modifiers.range_start && modifiers.range_end && !modifiers.range_middle)

  /** Connect range across week rows: no blanket `rounded-md` on span cells — square inward edges. */
  const rangeCornerClass = !inRange
    ? "rounded-md"
    : rangeSingleDay
      ? "rounded-md"
      : modifiers.range_middle
        ? "rounded-none"
        : modifiers.range_start
          ? "rounded-l-md rounded-r-none"
          : "rounded-l-none rounded-r-md"

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square h-full w-full items-center justify-center font-normal leading-none",
        rangeCornerClass,
        "text-foreground transition-all duration-150",
        "hover:bg-[#ff7670]/10",
        // Trip window (route picker): selectable days stand out vs disabled outside range
        isTripWindow &&
          "bg-primary/12 text-foreground shadow-[inset_0_0_0_1px_rgba(255,118,112,0.22)] dark:bg-white/[0.11] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]",
        // Dates used by other route stops (only when not selecting)
        isBusy &&
          "bg-muted/80 text-muted-foreground dark:bg-white/8 dark:text-white/80",
        // Trip window boundary markers
        isTripBoundary &&
          "outline outline-1 outline-offset-[-2px] outline-primary/35 dark:outline-white/25",
        // Today's date - subtle fill + ring (when not selected / not in range)
        isToday && "bg-[#ff7670]/20 ring-2 ring-[#ff7670]/45 ring-inset",
        // Selected single
        "data-[selected-single=true]:bg-[#ff7670] data-[selected-single=true]:text-white data-[selected-single=true]:font-semibold data-[selected-single=true]:hover:bg-[var(--brand-coral-hover)]",
        // Range start/end (corners via rangeCornerClass so row wraps stay flush)
        "data-[range-start=true]:bg-[#ff7670] data-[range-start=true]:text-white data-[range-start=true]:font-semibold data-[range-start=true]:hover:bg-[var(--brand-coral-hover)]",
        "data-[range-end=true]:bg-[#ff7670] data-[range-end=true]:text-white data-[range-end=true]:font-semibold data-[range-end=true]:hover:bg-[var(--brand-coral-hover)]",
        // Range middle
        "data-[range-middle=true]:bg-[#ff7670]/15 data-[range-middle=true]:text-foreground dark:data-[range-middle=true]:text-white",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
