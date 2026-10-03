/**
 * Copies text to the clipboard, working outside a secure context.
 *
 * `navigator.clipboard` is only exposed in a secure context -- HTTPS, or
 * localhost. This app is also reached over the LAN during development
 * (`http://192.168.x.x:3000`, kept working by `allowedDevOrigins`), and there
 * `navigator.clipboard` is not merely restricted, it is `undefined`. Calling it
 * unguarded throws a TypeError before any copy is attempted, which is why sharing
 * a link on a phone over the LAN reported that it could not copy.
 *
 * `document.execCommand("copy")` is deprecated but is the only mechanism that
 * works in that situation, and it is supported by every browser still shipping.
 * It needs a real, rendered, selected element to copy from, which is where most of
 * the care below goes.
 */

/**
 * Copies via a throwaway textarea.
 *
 * The element has to satisfy several unrelated requirements, and getting any one
 * of them wrong fails silently -- the command returns false and nothing is
 * copied, with no error to explain why:
 *
 * - In the document, and not `display: none` or `visibility: hidden`. A detached
 *   or unrendered element has no selection to copy.
 * - Positioned off-screen rather than hidden, for the same reason: `left: -9999px`
 *   is still rendered, `display: none` is not.
 * - `readOnly` set *after* the value, because setting it first makes some browsers
 *   refuse to select.
 * - A 16px font, because iOS Safari zooms the viewport when focusing an input
 *   whose computed font-size is under 16px, which would visibly jump the page on
 *   every copy.
 */
const copyViaExecCommand = (text: string): boolean => {
  const field = document.createElement("textarea");

  field.value = text;
  field.readOnly = true;
  field.setAttribute("aria-hidden", "true");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "-9999px";
  field.style.opacity = "0";
  field.style.fontSize = "16px";

  document.body.appendChild(field);

  try {
    field.focus();
    field.select();
    // iOS Safari ignores select() on a readonly field in some versions, so the
    // range is set explicitly as well. Harmless where select() already worked.
    field.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    // Always removed: a stray full-viewport textarea left in the body is focusable
    // and will be tabbed into.
    field.remove();
  }
};

/**
 * Copies text, reporting whether it worked.
 *
 * Tries the modern API first and falls back rather than the other way round: the
 * Clipboard API is more reliable where it exists, and where it is missing the
 * fallback is the only option rather than the preferred one.
 *
 * Returns false instead of throwing so the caller decides what a failure looks
 * like -- silently swallowing it would leave someone believing they copied a link
 * they did not.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Feature-detected with `?.` because the property is absent, not null, outside a
  // secure context.
  if (typeof navigator.clipboard?.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Reached when the document is not focused. A background tab or a window that
      // lost focus rejects here, and the fallback is worth trying anyway.
    }
  }

  return copyViaExecCommand(text);
};
