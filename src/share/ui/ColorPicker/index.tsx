import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import {
  EditableInput,
  Hue,
  Saturation,
  type HsvaColor,
  hexToHsva,
  hsvaToHex,
} from "@uiw/react-color"
import { cn } from "@/lib/utils"

/**
 * Normalize any accepted hex input to `#rrggbb` (lowercase, alpha dropped):
 * `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`. Anything else falls back to
 * `#000000` so the picker always has a valid, opaque color to drive the
 * saturation/hue preview.
 *
 * Nullish and blank input is tolerated: category colors are required by the
 * API and the database, but this is a shared component and a missing value
 * should degrade to the fallback rather than throw during render.
 */
function normalizeHex(input: string | null | undefined): string {
  let hex = (input ?? "").trim().toLowerCase()
  if (hex.startsWith("#")) hex = hex.slice(1)
  if (hex.length === 4) hex = hex.slice(0, 3) // drop alpha from #rgba
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
  return /^[0-9a-f]{6}$/.test(hex.slice(0, 6)) ? `#${hex.slice(0, 6)}` : "#000000"
}

/**
 * Shared preset swatches for category colors.
 */
export const PRESET_COLORS: string[] = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

/** Matches the opaque `#RGB`/`#RRGGBB` hex colors the picker emits. */
export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export interface ColorPickerProps {
  /**
   * Current color, e.g. `#7f56d9`. Unset or malformed values fall back to
   * black rather than throwing.
   */
  value: string | null | undefined
  onValueChange: (value: string) => void
  /** Optional preset colors shown as quick-pick swatches. */
  swatches?: string[]
  /** Accessible name for the trigger button. */
  label?: string
  disabled?: boolean
  className?: string
}

/** Circular drag pointer shared by the saturation area and the hue slider. */
function PickerPointer({
  left,
  top,
  color,
}: {
  left?: number | string
  top?: number | string
  color?: string
}) {
  return (
    <div
      className="absolute z-10 size-5 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
      style={{
        left,
        top,
        transform: "translate(-10px, -10px)",
        backgroundColor: color,
      }}
    />
  )
}

/**
 * Admin color picker built on the free `@uiw/react-color` library
 * (MIT): a 2D saturation panel, a hue slider, a hex input and preset
 * swatches, all inside a Base UI popover. Emits opaque `#rrggbb` hex colors.
 */
export function ColorPicker({
  value,
  onValueChange,
  swatches,
  label = "Pick a color",
  disabled,
  className,
}: ColorPickerProps) {
  const inputId = React.useId()
  const hsva = React.useMemo<HsvaColor>(
    () => hexToHsva(normalizeHex(value)),
    [value]
  )
  const currentHex = hsvaToHex(hsva)

  /** Emit an opaque 6-digit hex from any intermediate hsva state. */
  const emit = React.useCallback(
    (next: HsvaColor) => {
      onValueChange(hsvaToHex(next))
    },
    [onValueChange]
  )

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        render={
          <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            className={cn(
              "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
        }
      >
        <span
          className="size-5 rounded-md border border-foreground/20 shadow-inner"
          style={{ backgroundColor: currentHex }}
        />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          sideOffset={8}
          align="start"
          alignOffset={0}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="color-picker-popover"
            className={cn(
              "relative isolate z-50 w-64 origin-(--transform-origin) rounded-md bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <Saturation
              hsva={hsva}
              radius={6}
              style={{ width: "100%", height: 132 }}
              pointer={(props) => (
                <PickerPointer {...props} color={currentHex} />
              )}
              onChange={(next) => emit(next)}
            />

            <Hue
              hue={hsva.h}
              style={{ width: "100%", height: 24, marginTop: 12 }}
              radius={6}
              pointer={(props) => (
                <PickerPointer
                  {...props}
                  color={`hsl(${hsva.h} 100% 50%)`}
                />
              )}
              onChange={(newHue) => emit({ ...hsva, ...newHue })}
            />

            <div className="mt-3 flex items-center gap-2">
              <span
                className="size-8 shrink-0 rounded-md border border-border shadow-inner"
                style={{ backgroundColor: currentHex }}
              />
              <EditableInput
                id={inputId}
                value={currentHex}
                aria-label="Hex value"
                style={{ flex: 1, minWidth: 0 }}
                onChange={(_, rawHex) =>
                  onValueChange(normalizeHex(String(rawHex)))
                }
                renderInput={({ style: _inlineStyle, ...inputProps }) => (
                  <input
                    {...inputProps}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                )}
              />
            </div>

            {swatches && swatches.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {swatches.map((swatch) => {
                  const safeSwatch = normalizeHex(swatch)
                  return (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => onValueChange(safeSwatch)}
                      aria-label={safeSwatch}
                      title={safeSwatch}
                      className={cn(
                        "size-6 cursor-pointer rounded-full border border-foreground/20 shadow-inner transition-[box-shadow] outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
                        currentHex.toLowerCase() ===
                          safeSwatch.toLowerCase() &&
                          "ring-2 ring-ring ring-offset-2 ring-offset-popover"
                      )}
                      style={{ backgroundColor: safeSwatch }}
                    />
                  )
                })}
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}