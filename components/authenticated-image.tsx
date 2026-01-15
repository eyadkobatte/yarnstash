'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image, { type ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';

interface AuthenticatedImageProps extends Omit<ImageProps, 'src'> {
  bucket: string;
  path: string;
}

/**
 * A component that fetches and displays an image from a private Supabase bucket
 * using the user's authorization header to respect RLS policies.
 */
export function AuthenticatedImage({
  bucket,
  path,
  alt,
  ...props
}: AuthenticatedImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const supabase = createClient();

    async function loadImage() {
      if (!path) {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
        return;
      }

      try {
        if (!cancelled) setLoading(true);
        // download() automatically uses the current session's JWT in the Authorization header
        const { data, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(path);

        if (cancelled) return;

        if (downloadError) throw downloadError;

        if (data) {
          objectUrl = URL.createObjectURL(data);
          if (!cancelled) {
            setUrl(objectUrl);
            setError(false);
          } else {
            // If cancelled after creation but before setting state, revoke immediately
            URL.revokeObjectURL(objectUrl);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Error loading authenticated image:', e);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadImage();

    // Cleanup: revoke the object URL to prevent memory leaks
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bucket, path]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted animate-pulse rounded-md ${props.className || ''}`}
        style={{ width: props.width, height: props.height }}
      >
        <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground rounded-md ${props.className || ''}`}
        style={{ width: props.width, height: props.height }}
      >
        <ImageIcon className="h-5 w-5 opacity-20" />
      </div>
    );
  }

  // We use unoptimized because Next.js server cannot optimize a client-side blob URL
  return <Image src={url} alt={alt} {...props} unoptimized />;
}
