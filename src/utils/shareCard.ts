import { stripHtml, truncateText } from './textUtils';

type ShareCardInput = {
  title: string;
  content: string;
  authorName?: string;
  mood?: string;
};

export async function generateShareCardImage(input: ShareCardInput): Promise<Blob | null> {
  const plain = truncateText(stripHtml(input.content), 280);
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(0.5, '#8b5cf6');
  gradient.addColorStop(1, '#a855f7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, 60, 120, width - 120, height - 240, 32);
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 52px Inter, system-ui, sans-serif';
  wrapText(ctx, input.title, 100, 220, width - 200, 62);

  ctx.fillStyle = '#4b5563';
  ctx.font = '32px Inter, system-ui, sans-serif';
  const bodyStartY = 220 + measureWrappedHeight(ctx, input.title, width - 200, 62) + 40;
  wrapText(ctx, plain || 'Read this story on WriteAnon', 100, bodyStartY, width - 200, 44);

  if (input.mood) {
    ctx.fillStyle = '#6366f1';
    ctx.font = '600 28px Inter, system-ui, sans-serif';
    ctx.fillText(input.mood.charAt(0).toUpperCase() + input.mood.slice(1), 100, height - 180);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Inter, system-ui, sans-serif';
  ctx.fillText('WriteAnon', 100, height - 100);
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.fillText('writeanon.in — Your story. Your secret.', 100, height - 58);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}

function measureWrappedHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let lines = 1;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines += 1;
      line = word;
    } else {
      line = testLine;
    }
  }

  return lines * lineHeight;
}
