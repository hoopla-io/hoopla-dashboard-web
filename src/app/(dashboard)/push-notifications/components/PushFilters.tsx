import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DateRangePicker } from "@/components/pickers/date-range-picker";
import { PageToolbar } from "@/components/layout/page-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PUSH_KINDS, PUSH_STATUSES, formatPushKind, formatPushStatus } from "@/lib/push-notification";

type PushFiltersProps = {
  search: string;
  kind: string;
  status: string;
  from: string;
  to: string;
  hasFilters: boolean;
  onSearchChange: (value: string | null) => void;
  onKindChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRangeChange: (from: string | null, to: string | null) => void;
  onClear: () => void;
};

export function PushFilters({
  search,
  kind,
  status,
  from,
  to,
  hasFilters,
  onSearchChange,
  onKindChange,
  onStatusChange,
  onRangeChange,
  onClear,
}: PushFiltersProps) {
  return (
    <PageToolbar className="flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <DateRangePicker from={from} to={to} onChange={onRangeChange} />

        <Select value={kind} onValueChange={onKindChange}>
          <SelectTrigger size="sm" className="w-56">
            <span className="text-muted-foreground">Kind:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PUSH_KINDS.map((value) => (
              <SelectItem key={value} value={value}>
                {formatPushKind(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger size="sm" className="w-56">
            <span className="text-muted-foreground">Status:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PUSH_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {formatPushStatus(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Customer phone or name…"
          className="w-60"
        />
      </div>
      <Button variant="outline" size="sm" onClick={onClear} disabled={!hasFilters}>
        Clear filters
      </Button>
    </PageToolbar>
  );
}
