import React, { useMemo, useState } from 'react';
import {
  X,
  Link2,
  Copy,
  Share2,
  MessageCircle,
  Facebook,
  Send,
  Linkedin,
  Instagram,
  Image as ImageIcon,
  Loader2,
  QrCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  buildSharePayload,
  getPlatformShareUrl,
  openShareWindow,
  shareWithNativeOrCopy,
} from '../../utils/shareUtils';
import { generateShareCardImage } from '../../utils/shareCard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  title: string;
  content: string;
  mood?: string;
  authorName?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  postId,
  title,
  content,
  mood,
  authorName,
}) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const payload = useMemo(
    () => buildSharePayload(title, content, postId),
    [title, content, postId]
  );

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${payload.shareText} ${payload.url}`);
      toast.success('Link and preview copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    const result = await shareWithNativeOrCopy({
      title: payload.title,
      shareText: payload.shareText,
      url: payload.url,
    });
    if (result === 'shared') toast.success('Shared successfully!');
    else if (result === 'copied') toast.success('Link copied to clipboard!');
    else if (result === 'failed') toast.error('Could not share. Try copying the link.');
  };

  const handlePlatformShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'telegram' | 'linkedin') => {
    const shareUrl = getPlatformShareUrl(platform, payload);
    if (shareUrl) openShareWindow(shareUrl);
  };

  const handleShareAsImage = async (target: 'native' | 'download') => {
    setIsGeneratingImage(true);
    try {
      const blob = await generateShareCardImage({
        title,
        content,
        mood,
        authorName,
      });
      if (!blob) {
        toast.error('Could not create share image');
        return;
      }

      const file = new File([blob], `writeanon-${postId.slice(-6)}.png`, { type: 'image/png' });

      if (target === 'native' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text: payload.shareText,
          url: payload.url,
          files: [file],
        });
        toast.success('Share image to WhatsApp Status or Instagram Story!');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        'Image saved! Open WhatsApp Status or Instagram Story and add it from your gallery.'
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to create share image');
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload.url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Share</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview card */}
          <div className="flex gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900 truncate">{title}</p>
              <p className="text-sm text-neutral-600 mt-1 line-clamp-3">{payload.preview}</p>
              <p className="text-xs text-neutral-400 mt-2 truncate">{payload.url}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="p-2 border border-neutral-200 rounded-lg hover:bg-white transition-colors"
                title="Show QR code"
              >
                <QrCode className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 border border-neutral-200 rounded-lg hover:bg-white transition-colors"
                title="Copy link"
              >
                <Copy className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
          </div>

          {showQr && (
            <div className="flex justify-center p-4 bg-white border border-neutral-200 rounded-xl">
              <img src={qrUrl} alt="QR code for post link" className="w-40 h-40" />
            </div>
          )}

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all"
            >
              <Share2 className="w-5 h-5" />
              Share via device
            </button>
          )}

          {/* Social platforms */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3">Share to social media</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handlePlatformShare('whatsapp')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs font-medium text-neutral-700">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareAsImage('native')}
                disabled={isGeneratingImage}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-green-50 hover:border-green-200 transition-colors disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-green-600" />
                )}
                <span className="text-xs font-medium text-neutral-700">WA Status</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareAsImage('native')}
                disabled={isGeneratingImage}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-pink-50 hover:border-pink-200 transition-colors disabled:opacity-50"
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                <span className="text-xs font-medium text-neutral-700">Insta Story</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlatformShare('facebook')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Facebook className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-neutral-700">Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlatformShare('twitter')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-sky-50 hover:border-sky-200 transition-colors"
              >
                <Send className="w-6 h-6 text-sky-500" />
                <span className="text-xs font-medium text-neutral-700">X / Twitter</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlatformShare('telegram')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Send className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-medium text-neutral-700">Telegram</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlatformShare('linkedin')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Linkedin className="w-6 h-6 text-blue-700" />
                <span className="text-xs font-medium text-neutral-700">LinkedIn</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-500 text-center">
            For WhatsApp Status &amp; Instagram Story, use the image share buttons — on mobile this opens your gallery directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
