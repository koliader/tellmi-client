import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

/**
 * Tabs built on base-ui, following the same wrapper pattern as the other ui
 * components here: style the primitive, keep the API in one place.
 *
 * The primitive is used rather than a hand-rolled implementation because tab
 * behaviour is mostly correctness rather than looks. It owns the roving
 * tabindex, so a keyboard user reaches the active tab and then arrows between
 * tabs instead of tabbing through all of them; it wires aria-selected and the
 * tabpanel relationship, which is what makes a screen reader announce the panel
 * as belonging to the tab it was chosen from. Reimplementing that is a
 * surprisingly large amount of subtle work.
 */
function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(
        "flex flex-col gap-4",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        /*
         * The selected tab is marked on `data-active`, which is what this version
         * of base-ui sets. `data-selected` is what the Tabs API in the React
         * docs uses, and styling that instead leaves all three tabs looking
         * identical -- a selected tab with a transparent background is
         * indistinguishable from an unselected one, and nothing on the page says
         * which panel is showing.
         *
         * Marked three ways rather than one: the raised background and the
         * foreground colour are the primary signal, and the inset ring is what
         * keeps it legible when the tab bar and the page background are close in
         * tone -- which they are in both themes, since the bar is `bg-muted`.
         */
        "data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm",
        "data-[active]:ring-1 data-[active]:ring-border data-[active]:ring-inset",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
