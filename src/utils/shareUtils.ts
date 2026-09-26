import { stripHtml, truncateText } from './textUtils';

export type SharePlatform =
  | 'whatsapp'
  | 'facebook'
  | 'twitter'
  | 'telegram'
  | 'linkedin'
  | 'native'
  | 'copy';

export function buildSharePayload(title: string, content: string, postId: string) {
  const url = `${window.location.origin}/post/${postId}`;
  const preview = truncateText(stripHtml(content), 200);
  const shareText = preview
    ? `${title}\n\n${preview}\n\nRead on WriteAnon:`
    : `${title}\n\nRead on WriteAnon:`;

  return { url, preview, shareText, title };
}

export function getPlatformShareUrl(
  platform: SharePlatform,
  payload: { url: string; shareText: string; title: string }
): string | null {
  const { url, shareText, title } = payload;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default:
      return null;
  }
}

export function openShareWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
}

export async function shareWithNativeOrCopy(payload: {
  title: string;
  shareText: string;
  url: string;
  files?: File[];
}): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const { title, shareText, url, files } = payload;

  if (navigator.share) {
    try {
      const shareData: ShareData = {
        title,
        text: shareText,
        url,
      };
      if (files?.length && navigator.canShare?.({ files })) {
        await navigator.share({ ...shareData, files });
      } else {
        await navigator.share(shareData);
      }
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
    }
  }

  try {
    await navigator.clipboard.writeText(`${shareText} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
