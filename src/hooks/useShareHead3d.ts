import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import { type ExtractedFaces } from '../modules/TextureExtractor';
import { checkRateLimit, RateLimitError } from '../lib/rateLimit';

export function useShareHead3d() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  const share = async (
    previewCanvas: HTMLCanvasElement | null,
    skinSrc: string,
    extractedFaces: ExtractedFaces | null,
    creatorName?: string,
    description?: string
  ) => {
    setLoading(true);
    setError(null);
    setShareUrl(null);
    setMinutesLeft(null);

    try {
      if (!skinSrc || !extractedFaces) {
        throw new Error('Skin source and face textures are required.');
      }

      await checkRateLimit('head3d');

      const slug = nanoid(10);

      // 1. Convert original skin (data URL or object URL) to Blob and upload
      const skinBlob = await dataUrlToBlob(skinSrc);
      const { error: skinUploadErr } = await supabase.storage
        .from('conversions')
        .upload(`head3d/${slug}/skin.png`, skinBlob, {
          contentType: 'image/png'
        });
      if (skinUploadErr) throw skinUploadErr;

      // 2. Upload Preview Screenshot (Required field in table, using fallback if not available)
      const previewBlob = await getPreviewBlob(previewCanvas);
      const { error: previewUploadErr } = await supabase.storage
        .from('conversions')
        .upload(`head3d/${slug}/preview.png`, previewBlob, {
          contentType: 'image/png'
        });
      if (previewUploadErr) throw previewUploadErr;

      // 3. Upload Face Textures for both Head layer and Overlay layer
      const faceUrls: any = {
        head: {},
        overlay: {}
      };

      // Upload head layer faces
      for (const [key, face] of Object.entries(extractedFaces.head)) {
        const faceBlob = await dataUrlToBlob(face.dataUrl);
        const path = `head3d/${slug}/faces/head/${key}.png`;
        const { error: uploadErr } = await supabase.storage
          .from('conversions')
          .upload(path, faceBlob, {
            contentType: 'image/png'
          });
        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from('conversions').getPublicUrl(path);
        faceUrls.head[key] = data.publicUrl;
      }

      // Upload overlay layer faces
      for (const [key, face] of Object.entries(extractedFaces.overlay)) {
        const faceBlob = await dataUrlToBlob(face.dataUrl);
        const path = `head3d/${slug}/faces/overlay/${key}.png`;
        const { error: uploadErr } = await supabase.storage
          .from('conversions')
          .upload(path, faceBlob, {
            contentType: 'image/png'
          });
        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from('conversions').getPublicUrl(path);
        faceUrls.overlay[key] = data.publicUrl;
      }

      // 4. Get public URLs for Skin and Preview
      const { data: skinUrlData } = supabase.storage.from('conversions').getPublicUrl(`head3d/${slug}/skin.png`);
      const { data: previewUrlData } = supabase.storage.from('conversions').getPublicUrl(`head3d/${slug}/preview.png`);

      // 5. Insert metadata row to shares_head3d table
      const { error: dbErr } = await supabase
        .from('shares_head3d')
        .insert({
          slug,
          preview_url: previewUrlData.publicUrl,
          skin_url: skinUrlData.publicUrl,
          face_urls: faceUrls,
          creator_name: creatorName || null,
          description: description || null
        });
      if (dbErr) throw dbErr;

      const generatedUrl = `${window.location.origin}/share/head3d/${slug}`;
      setShareUrl(generatedUrl);
      return generatedUrl;
    } catch (err: unknown) {
      console.error('Error during Head3D share:', err);
      if (err instanceof RateLimitError) {
        setMinutesLeft(err.minutesLeft);
        setError(err.message);
      } else {
        const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred while sharing.';
        setError(errMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { shareUrl, loading, error, minutesLeft, share };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to capture canvas image'));
    }, 'image/png');
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (dataUrl.startsWith('data:')) {
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const isBase64 = parts[0].indexOf('base64') >= 0;
      const dataStr = parts[1];

      if (isBase64) {
        const bstr = atob(dataStr);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      } else {
        const decoded = decodeURIComponent(dataStr);
        return new Blob([decoded], { type: mime });
      }
    } catch (e) {
      console.warn('Failed to parse data URL synchronously, falling back to fetch:', e);
    }
  }

  const res = await fetch(dataUrl);
  return await res.blob();
}

async function getPreviewBlob(previewCanvas: HTMLCanvasElement | null): Promise<Blob> {
  if (previewCanvas) {
    try {
      return await canvasToBlob(previewCanvas);
    } catch (e) {
      console.warn('Failed to convert preview canvas to blob:', e);
    }
  }
  // Programmatic 1x1 transparent canvas fallback to satisfy DB not null constraint
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
