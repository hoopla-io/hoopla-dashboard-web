import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const toApiDate = (date: Date) => format(date, "yyyy-MM-dd");

const parseApiDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`) : undefined;

export function DateRangePicker({
  from,
  to,
  onChange,
  emptyLabel = "All time",
}: {
  from: string;
  to: string;
  onChange: (from: string | null, to: string | null) => void;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined =
    from || to ? { from: parseApiDate(from), to: parseApiDate(to) } : undefined;

  const label = from && to ? `${from} — ${to}` : from || to || emptyLabel;

  const applyPreset = (start: Date, end: Date) => {
    onChange(toApiDate(start), toApiDate(end));
    setOpen(false);
  };

  const now = new Date();
  const lastMonth = subMonths(now, 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal",
            !from && !to && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
          {(from || to) && (
            <span
              role="button"
              tabIndex={0}
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null, null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onChange(null, null);
                }
              }}
            >
              <X className="h-4 w-4 opacity-50 hover:opacity-100" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-1 border-b p-2 sm:flex-row">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyPreset(startOfMonth(now), endOfMonth(now))}
          >
            This month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyPreset(startOfMonth(lastMonth), endOfMonth(lastMonth))}
          >
            Last month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyPreset(subDays(now, 6), now)}
          >
            Last 7 days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null, null);
              setOpen(false);
            }}
          >
            {emptyLabel}
          </Button>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          defaultMonth={selected?.from ?? now}
          onSelect={(range) =>
            onChange(
              range?.from ? toApiDate(range.from) : null,
              range?.to ? toApiDate(range.to) : null
            )
          }
        />
      </PopoverContent>
    </Popover>
  );
}
