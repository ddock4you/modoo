type ImageDimensions = { width: number; height: number };

export async function readImageDimensions(blob: Blob): Promise<ImageDimensions> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(blob);
    try {
      return { width: bmp.width, height: bmp.height };
    } finally {
      const maybeClose = (bmp as unknown as { close?: () => void }).close;
      if (typeof maybeClose === "function") {
        maybeClose.call(bmp);
      }
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";

    return await new Promise<ImageDimensions>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
