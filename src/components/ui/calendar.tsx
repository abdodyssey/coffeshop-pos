"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-8",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-bold text-stone-900",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 z-10"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday:
          "text-stone-400 rounded-md w-9 font-bold text-[0.7rem] uppercase tracking-tighter text-center",
        week: "flex w-full mt-1 justify-between",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-stone-100 hover:text-stone-900 rounded-lg transition-all"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-stone-900 text-stone-50 hover:bg-stone-900 hover:text-stone-50 focus:bg-stone-900 focus:text-stone-50 rounded-lg",
        today: "bg-stone-100 text-stone-900 rounded-lg",
        outside:
          "day-outside text-stone-300 opacity-50 aria-selected:bg-stone-100/50 aria-selected:text-stone-400 aria-selected:opacity-30",
        disabled: "text-stone-400 opacity-50",
        range_middle:
          "aria-selected:bg-stone-100 aria-selected:text-stone-900 !rounded-none first:rounded-l-lg last:rounded-r-lg",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
