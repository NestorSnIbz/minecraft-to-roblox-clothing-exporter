/**
 * SkinParser.ts
 * Module to load and validate Minecraft PNG skins.
 */

export interface SkinValidationResult {
  isValid: boolean;
  error?: string;
  image?: HTMLImageElement;
}

/**
 * Validates and loads a Minecraft skin PNG file.
 * Checks that it is a valid image, PNG format, and is exactly 64x64 pixels.
 * 
 * @param file The uploaded file
 * @returns Promise resolving to a SkinValidationResult
 */
export function validateAndLoadSkin(file: File): Promise<SkinValidationResult> {
  return new Promise((resolve) => {
    // 1. Validate file type
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      resolve({
        isValid: false,
        error: 'El archivo debe ser un formato de imagen PNG.',
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 2. Validate dimensions (Minecraft standard skins are 64x64 or 64x32, we enforce 64x64 as requested)
        if (img.width !== 64 || img.height !== 64) {
          resolve({
            isValid: false,
            error: `La skin debe ser de resolución exacta 64x64 píxeles. (Detectado: ${img.width}x${img.height})`,
          });
          return;
        }

        resolve({
          isValid: true,
          image: img,
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'El archivo no es una imagen válida o está dañado.',
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Ocurrió un error al leer el archivo.',
      });
    };

    reader.readAsDataURL(file);
  });
}
