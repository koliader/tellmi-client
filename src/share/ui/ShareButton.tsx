"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/src/share/lib/copyToClipboard";

/**
 * How long the tick stays after a copy, before the icon goes back.
 *
 * Long enough to notice without being a state the page holds on to. It is also
 * the only feedback the copy has on a desktop, where there is no OS confirmation.
 */
const COPIED_MS = 2000;

/**
 * Copies a link to the clipboard.
 *
 * One component for both posts and profiles rather than two call sites, because
 * the awkward parts are the same in both and are the parts worth getting right:
 *
 * - The tap copies immediately, on every device. It does not open the OS share
 *   sheet first, which was the earlier behaviour and the wrong one: on a phone the
 *   sheet is modal, so the link only reaches the clipboard if the person then finds
 *   "Copy" in a list of targets -- several taps and a menu to do the one thing the
 *   button is labelled for. The sheet is also unavailable outside a secure context,
 *   so over the LAN it either failed or silently did nothing. Copying on tap is
 *   predictable everywhere; anyone wanting the full share sheet has the browser's
 *   own long-press on the address bar.
 * - The URL is made absolute first. The clipboard would otherwise receive
 *   "/posts/3", which is useless to whoever receives it.
 * - Copying does NOT require a secure context here. That is handled in
 *   `copyToClipboard`, and it is the whole reason the phone could not do it.
 */
export const ShareButton = ({
  path,
  /** What the thing being shared is called in the confirmation and the label. */
  label = "post",
  variant = "ghost",
  size = "icon-sm",
  className,
}: {
  path: string;
  label?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "icon-sm" | "sm";
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const share = useCallback(async () => {
    // Absolute, because a relative path pasted into a message is not a link.
    const url = new URL(path, window.location.origin).toString();

    const ok = await copyToClipboard(url);

    if (ok) {
      setCopied(true);
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);

      /*
       * A toast as well as the tick, because the two answer different questions.
       * The tick confirms the button did something; the toast says what happened
       * and where the link went, which is what someone actually needs to know
       * before they go and paste it somewhere. The tick alone leaves you having
       * to remember that you just copied, rather than having told you.
       *
       * Placed on the copy rather than on the click, so a native share sheet
       * -- which returns before anything was copied -- does not claim a copy it
       * never made.
       */
      toast.add({
        type: "success",
        title: "Link copied to clipboard",
        description: url,
      });
    } else {
      /*
       * Reported rather than swallowed. Someone who taps share and sees nothing
       * assume it worked, then paste whatever was on the clipboard before, and
       * send the wrong thing. The address bar is a working way out, so the message
       * offers it rather than just reporting a failure.
       */
      toast.add({
        type: "error",
        title: "Could not copy the link",
        description: "Copy it from the address bar instead.",
      });
    }
  }, [path]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => void share()}
      className={cn("cursor-pointer", className)}
      /*
        Labelled by what it will do, not by the icon. "Share this post" survives
        being read out of context; a bare icon does not, and the tick that replaces
        it is a state change with no accessible announcement of its own.
      */
      aria-label={`Share this ${label}`}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      {/*
        Announced when the copy lands. The tick is a colour change on an icon, which
        is invisible to a screen reader, so without this the only confirmation a
        non-sighted visitor gets is silence.
      */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </Button>
  );
};
