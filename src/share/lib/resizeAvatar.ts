/**
 * Downsamples a chosen image to a square thumbnail before upload.
 *
 * Done in the browser rather than on the server for three reasons: a phone photo
 * is routinely several megabytes and the API caps storage at 512KB, so uploading
 * one unmodified is rejected outright; resizing locally avoids putting the
 * original through the network at all; and the result is predictable in size,
 * which a server-side resize's output would not be without an image library on
 * this side.
 *
 * Square-cropped rather than squashed, because an avatar is displayed in a circle
 * and a squashed image would have a visibly wrong aspect ratio in it. The crop is
 * centred, which is the least surprising choice for a portrait or a landscape
 * photo and needs no extra input from the member.
 *
 * Rejects anything the browser cannot decode, and anything that is not an image,
 * before a canvas is ever created -- a canvas would otherwise decode a file the
 * API will later refuse.
 */

const TARGET_EDGE = 256;

/** What the API accepts. Kept in step with MAX_AVATAR_BYTES on the service. */
const MAX_OUTPUT_BYTES = 512 * 1024;

export interface ResizedAvatar {
  blob: Blob;
  contentType: string;
  width: number;
  height: number;
}

/**
 * Encodes the canvas, stepping the quality and then the size down until the
 * output fits.
 *
 * A single `toBlob` at a fixed quality is not enough: 256x256 of a detailed
 * photo at q=0.9 is still comfortably over the cap, and there is no way to know
 * that without measuring. Stepping quality first keeps the image sharp for the
 * simple case (a flat-colour logo stays crisp at high quality) and only starts
 * shrinking pixels when quality alone cannot get under the cap.
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

export const resizeAvatar = async (file: File): Promise<ResizedAvatar> => {
  // A declared type is a hint, not evidence -- an .svg renamed to .png arrives
  // here claiming to be an image and is not one. SVG is excluded on purpose
  // beyond the decode: the API rejects it too, since serving a scriptable
  // document from the app's own origin would make that origin a target.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Choose a PNG, JPEG, GIF or WebP image");
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That file could not be read as an image");
  });

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = TARGET_EDGE;
    canvas.height = TARGET_EDGE;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("This browser cannot process the image");
    }

    // Centre crop to a square, then scale into the target.
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    ctx.drawImage(
      bitmap,
      sx,
      sy,
      side,
      side,
      0,
      0,
      TARGET_EDGE,
      TARGET_EDGE,
    );

    // WebP first: same pixels in fewer bytes for the kind of image an avatar
    // is. Falls back to JPEG where the browser cannot encode it, which is
    // Safari before 16.
    for (const type of ["image/webp", "image/jpeg"]) {
      for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
        const blob = await canvasToBlob(canvas, type, quality);
        if (blob && blob.size <= MAX_OUTPUT_BYTES) {
          return { blob, contentType: type, width: TARGET_EDGE, height: TARGET_EDGE };
        }
      }
    }

    // Still too large at the smallest step: halve the dimensions and retry once.
    // At 128x128 no realistic avatar is over 512KB, so if this also fails the
    // source is pathological and the honest answer is to refuse it.
    canvas.width = TARGET_EDGE / 2;
    canvas.height = TARGET_EDGE / 2;
    ctx.drawImage(
      bitmap,
      sx,
      sy,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const small = await canvasToBlob(canvas, "image/jpeg", 0.5);
    if (small && small.size <= MAX_OUTPUT_BYTES) {
      return {
        blob: small,
        contentType: "image/jpeg",
        width: canvas.width,
        height: canvas.height,
      };
    }

    throw new Error("That image is too detailed to use as an avatar");
  } finally {
    // The decoded bitmap is not garbage collected promptly on its own, and a
    // member trying several images in a row would hold each one.
    bitmap.close();
  }
};
