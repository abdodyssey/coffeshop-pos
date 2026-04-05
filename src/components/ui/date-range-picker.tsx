"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}) {
  return (
    <Field className={cn("w-72 md:w-80", className)}>
      <FieldLabel htmlFor="date-picker-range" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Periode Laporan</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className={cn(
              "justify-start px-3 h-11 rounded-xl border-slate-200 shadow-none hover:bg-slate-50 group transition-all active:scale-[0.98]",
              !date && "text-slate-500"
            )}
          >
            <CalendarIcon className="mr-2.5 h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="font-bold text-slate-900">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 rounded-2xl border-slate-100 shadow-2xl" 
          align="end"
          alignOffset={-4}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="rounded-2xl"
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
