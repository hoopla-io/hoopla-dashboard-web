import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

interface ReorderControlsProps {
  label: string;
  disabled: boolean;
  disabledReason?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export function ReorderControls({
  label,
  disabled,
  disabledReason,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
}: ReorderControlsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        draggable={!disabled}
        disabled={disabled}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 active:cursor-grabbing"
        aria-label={disabledReason ?? `Drag ${label} to reorder`}
        title={disabledReason ?? "Drag to reorder"}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={disabled || !canMoveUp}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label={`Move ${label} up`}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={disabled || !canMoveDown}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label={`Move ${label} down`}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
