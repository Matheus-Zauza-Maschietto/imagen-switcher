/**
 * Converts an SVG string into PNG and JPEG Blobs inside the browser context.
 * Performs clean drawing using HTML5 Canvas, ensuring transparency is preserved for PNG
 * and filled with a white background for JPEG.
 */
export async function convertSvgToRaster(
  svgContent: string
): Promise<{ pngBlob: Blob; jpgBlob: Blob } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = async () => {
      try {
        // Retrieve intrinsic width/height of the vector or default to 512px
        const width = img.naturalWidth || 512;
        const height = img.naturalHeight || 512;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }

        // 1. Draw PNG (supports transparent background)
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));

        // 2. Draw JPEG (fill white background to prevent transparent areas rendering as black)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const jpgBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));

        URL.revokeObjectURL(url);

        if (pngBlob && jpgBlob) {
          resolve({ pngBlob, jpgBlob });
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error('Rasterization conversion failed:', err);
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    img.onerror = (err) => {
      console.error('Failed to load SVG source into image element:', err);
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}
