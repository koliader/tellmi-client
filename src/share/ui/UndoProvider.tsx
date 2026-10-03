"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * How long an undo stays available.
 *
 * Long enough to notice a mistake, read what happened, and click: roughly the time
 * it takes to decide you did not mean it. Shorter and the undo is a thing you saw
 * once.
 */
const UNDO_WINDOW_MS = 10_000;

interface UndoOffer {
  id: number;
  message: string;
  onUndo: () => Promise<void>;
}

interface UndoContextValue {
  /** Reports an action that has already happened, and offers to take it back. */
  offer: (message: string, onUndo: () => Promise<void>) => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

/**
 * One pending undo, shared across the app.
 *
 * Layout-level rather than per-screen because a delete navigates away: a bar owned
 * by the page being left unmounts with it, so the undo would disappear at exactly
 * the moment it is wanted. It also cannot be a toast -- the toast manager's `add`
 * has no slot for an action, so a button cannot be attached to one without hiding
 * it inside the description, which is a sentence and not a control.
 *
 * `offer` is stable and holds no state of its own, so a component can call it from
 * a mutation callback without becoming a dependency of anything.
 */
export const UndoProvider = ({ children }: { children: React.ReactNode }) => {
  const [pending, setPending] = useState<UndoOffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setPending(null);
    setError(null);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const offer = useCallback(
    (message: string, onUndo: () => Promise<void>) => {
      clearTimer();
      setError(null);
      setBusy(false);
      setPending({ id: nextId.current++, message, onUndo });
      timer.current = setTimeout(() => {
        timer.current = null;
        setPending(null);
      }, UNDO_WINDOW_MS);
    },
    [clearTimer],
  );

  /*
   * Declared before the button below and called from its onClick, rather than
   * exposed as a callback. The `busy` guard lives in the handler so a second click
   * during the in-flight restore cannot start a second one -- a restore followed
   * immediately by a delete is a worse outcome than a button that does nothing for
   * a moment.
   */
  const runUndo = useCallback(
    async (offerToRun: UndoOffer) => {
      try {
        await offerToRun.onUndo();
        // Dismissed only on success. On failure the bar stays carrying the error
        // rather than disappearing as though the undo had worked.
        setPending(null);
        clearTimer();
      } catch (cause) {
        setError(readableError(cause));
        setBusy(false);
      }
    },
    [clearTimer],
  );

  const value = useMemo<UndoContextValue>(() => ({ offer }), [offer]);

  return (
    <UndoContext.Provider value={value}>
      {children}

      {pending ? (
        <div
          // Polite, not assertive: an undo is an offer, and interrupting a screen
          // reader to announce one is worse than the problem it fixes.
          role="status"
          aria-live="polite"
          data-slot="undo-bar"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex w-auto max-w-sm items-center gap-3 rounded-lg border bg-card p-3 shadow-lg sm:right-4 sm:left-auto sm:mx-0 sm:w-full"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{pending.message}</p>
            {error ? (
              <p className="mt-0.5 text-xs text-destructive">{error}</p>
            ) : null}
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (busy) {
                return;
              }
              setBusy(true);
              void runUndo(pending);
            }}
          >
            <Undo2 className="mr-1.5 size-3.5" aria-hidden />
            {busy ? "Undoing" : "Undo"}
          </Button>

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}
    </UndoContext.Provider>
  );
};

/** Reads a message out of a failure, falling back to something plain. */
const readableError = (cause: unknown): string => {
  const message = (cause as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return cause instanceof Error && cause.message
    ? cause.message
    : "That could not be undone.";
};

/** Throws outside the provider rather than silently doing nothing. */
export const useUndo = (): UndoContextValue => {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used inside <UndoProvider>");
  }
  return context;
};
