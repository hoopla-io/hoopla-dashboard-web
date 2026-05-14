
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const updateScroll = React.useCallback(() => {
    const el = listRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  React.useEffect(() => {
    const el = listRef.current
    if (!el) return
    updateScroll()
    el.addEventListener("scroll", updateScroll, { passive: true })
    const ro = new ResizeObserver(updateScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScroll)
      ro.disconnect()
    }
  }, [updateScroll])

  const SCROLL_BUTTON_WIDTH = 40

  const scrollToward = (direction: "left" | "right") => {
    const el = listRef.current
    if (!el) return
    const tabs = Array.from(
      el.querySelectorAll<HTMLElement>('[role="tab"]')
    )
    if (tabs.length === 0) return

    const viewLeft = el.scrollLeft + SCROLL_BUTTON_WIDTH
    const viewRight =
      el.scrollLeft + el.clientWidth - SCROLL_BUTTON_WIDTH
    const maxScroll = el.scrollWidth - el.clientWidth

    if (direction === "left") {
      for (let i = tabs.length - 1; i >= 0; i--) {
        if (tabs[i].offsetLeft < viewLeft) {
          const target = Math.max(0, tabs[i].offsetLeft - SCROLL_BUTTON_WIDTH)
          el.scrollTo({ left: target, behavior: "smooth" })
          return
        }
      }
      el.scrollTo({ left: 0, behavior: "smooth" })
    } else {
      for (const t of tabs) {
        const tRight = t.offsetLeft + t.offsetWidth
        if (tRight > viewRight) {
          const target = Math.min(
            maxScroll,
            tRight - el.clientWidth + SCROLL_BUTTON_WIDTH
          )
          el.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
          return
        }
      }
      el.scrollTo({ left: maxScroll, behavior: "smooth" })
    }
  }

  return (
    <div className="relative inline-flex max-w-full">
      {canScrollLeft ? (
        <button
          type="button"
          aria-label="Scroll tabs left"
          onClick={() => scrollToward("left")}
          className="absolute left-0 top-0 z-10 flex h-full w-10 items-center justify-start rounded-l-lg bg-linear-to-r from-muted via-muted/90 to-transparent pl-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}
      <TabsPrimitive.List
        ref={listRef}
        data-slot="tabs-list"
        className={cn(
          "bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-center overflow-x-auto rounded-lg p-[3px] scrollbar-none [&::-webkit-scrollbar]:hidden",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
      {canScrollRight ? (
        <button
          type="button"
          aria-label="Scroll tabs right"
          onClick={() => scrollToward("right")}
          className="absolute right-0 top-0 z-10 flex h-full w-10 items-center justify-end rounded-r-lg bg-linear-to-l from-muted via-muted/90 to-transparent pr-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
