import {
  ScheduleData,
  DayOfWeek,
  StreamCategory,
  CharacterImageConfig,
  FontStyleType,
} from '../types/schedule';
import { ScheduleTheme } from '../types/theme';
import { CalculatedLayout, RenderOptions } from '../types/canvas';
import { calculateLayout } from './layout-calculator';
import { drawAvatar, getImageDimensions } from './avatar-compositor';
import { getThemeById } from '../themes';

export interface RenderScheduleOptions extends Partial<RenderOptions> {
  avatarConfig?: CharacterImageConfig;
  enableDimmerMask?: boolean;
  customBgImage?: CanvasImageSource | null;
}

/**
 * 曜日の日本語表示名
 */
export const DAY_OF_WEEK_JA: Record<DayOfWeek, string> = {
  MON: '月',
  TUE: '火',
  WED: '水',
  THU: '木',
  FRI: '金',
  SAT: '土',
  SUN: '日',
};

/**
 * 配信カテゴリの日本語表示名
 */
export const CATEGORY_LABELS: Record<StreamCategory, string> = {
  game: 'ゲーム',
  chat: '雑談',
  sing: '歌枠',
  collab: 'コラボ',
  event: 'イベント',
  holiday: 'お休み',
  other: '配信',
};

/**
 * プラットフォーム別のバッジ配色定義
 */
export const PLATFORM_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  YouTube: { bg: '#ef4444', text: '#ffffff' },
  Twitch: { bg: '#9146ff', text: '#ffffff' },
  TwitCasting: { bg: '#0284c7', text: '#ffffff' },
  IRIAM: { bg: '#ec4899', text: '#ffffff' },
  TikTok: { bg: '#111827', text: '#00f3ff' },
  '17LIVE': { bg: '#f59e0b', text: '#111827' },
  ニコニコ: { bg: '#374151', text: '#ffffff' },
};

/**
 * HEX または RGB(A) カラー文字列に指定のアルファ値 (0.0 〜 1.0) を適用した rgba() 文字列を返す純粋関数
 */
export function applyAlphaToColor(color: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const trimmed = color.trim();

  // #RRGGBB または #RGB
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
      }
    }
  }

  // rgba(r, g, b, a) または rgb(r, g, b)
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${clampedAlpha})`;
  }

  return color;
}

/**
 * 背景色の輝度から視認性の高い文字色（白または濃紺）を自動判定する純粋関数
 */
export function getContrastTextColor(hexColor: string): string {
  const trimmed = hexColor.trim();
  if (!trimmed.startsWith('#')) return '#ffffff';
  let hex = trimmed.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length < 6) return '#ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#ffffff';
  // 相対輝度計算
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#ffffff';
}

/**
 * スケジュール設定（フォント選択、推し色、カード不透明度）をテーマに合成した実効テーマを返す純粋関数
 */
export function resolveEffectiveTheme(
  baseTheme: ScheduleTheme,
  schedule: ScheduleData
): ScheduleTheme {
  let typography = { ...baseTheme.typography };
  const fontStyle: FontStyleType | undefined = schedule.fontStyle;

  if (fontStyle === 'gothic') {
    const stack = "'Zen Kaku Gothic New', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif";
    typography = { titleFont: stack, dayFont: stack, bodyFont: stack };
  } else if (fontStyle === 'rounded') {
    const stack = "'M PLUS Rounded 1c', 'Kosugi Maru', sans-serif";
    typography = { titleFont: stack, dayFont: stack, bodyFont: stack };
  } else if (fontStyle === 'serif') {
    const stack = "'Shippori Mincho', 'Noto Serif JP', 'Hiragino Mincho ProN', serif";
    typography = { titleFont: stack, dayFont: stack, bodyFont: stack };
  }

  const colors = { ...baseTheme.colors };

  // 推し色（カスタムアクセントカラー）の適用
  if (schedule.customAccentColor && schedule.customAccentColor.trim().length > 0) {
    const customColor = schedule.customAccentColor.trim();
    colors.accentPrimary = customColor;
    colors.headerAccent = customColor;
    colors.timeBadgeBg = customColor;
    colors.timeBadgeText = getContrastTextColor(customColor);
    colors.cardBorder = applyAlphaToColor(customColor, 0.55);
    if (baseTheme.decorations.cardGlow) {
      colors.cardShadow = applyAlphaToColor(customColor, 0.35);
    }
  }

  // カード背景不透明度の調整 (0.3 〜 1.0)
  if (typeof schedule.cardOpacity === 'number' && !Number.isNaN(schedule.cardOpacity)) {
    colors.cardBg = applyAlphaToColor(baseTheme.colors.cardBg, schedule.cardOpacity);
  }

  return {
    ...baseTheme,
    colors,
    typography,
  };
}

/**
 * 角丸矩形パスを Canvas コンテキストに登録する
 * (ctx.roundRect がない古い環境やモック環境でも安全に動作するフォールバック付き)
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(Math.max(0, radius), width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }
}

/**
 * テキストを指定幅に合わせて複数行に分割する純粋関数
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  if (!text) return [];
  if (maxWidth <= 0) return [text];

  const characters = Array.from(text);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText ? ctx.measureText(testLine) : { width: testLine.length * 10 };
    const testWidth = metrics.width;

    if (testWidth > maxWidth && currentLine.length > 0) {
      if (lines.length === maxLines - 1) {
        // 最終行で最大幅を超える場合は省略記号をつけて終了
        currentLine = currentLine.slice(0, -1) + '…';
        lines.push(currentLine);
        return lines;
      }
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 4芒星（キラキラ星）を描画するヘルパー
 */
function drawSparkleStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.28, cy - size * 0.28);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx + size * 0.28, cy + size * 0.28);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.28, cy + size * 0.28);
  ctx.lineTo(cx - size, cy);
  ctx.lineTo(cx - size * 0.28, cy - size * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * ダイヤ装飾（◆）を描画するヘルパー
 */
function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.75, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.75, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * テンプレート固有の装飾フレームおよび背景モチーフを描画する
 */
export function drawTemplateFrameAndMotifs(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ScheduleTheme
): void {
  const scale = width / 1920;
  const frameStyle = theme.decorations.frameStyle ?? 'cyber';
  const s = (v: number) => Math.round(v * scale);

  ctx.save();

  if (frameStyle === 'cyber') {
    // サイバーネオン: 四隅のL字コーナーブラケット & HUDライン
    const pad = s(24);
    const len = s(72);
    ctx.strokeStyle = theme.colors.accentPrimary;
    ctx.lineWidth = Math.max(2, s(3));

    ctx.beginPath();
    // 左上
    ctx.moveTo(pad, pad + len);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + len, pad);
    // 右上
    ctx.moveTo(width - pad - len, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + len);
    // 左下
    ctx.moveTo(pad, height - pad - len);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + len, height - pad);
    // 右下
    ctx.moveTo(width - pad - len, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - len);
    ctx.stroke();

    // サブアクセントのドット装飾
    ctx.fillStyle = theme.colors.accentSecondary;
    ctx.fillRect(pad + len + s(10), pad - s(2), s(24), s(4));
    ctx.fillRect(width - pad - len - s(34), height - pad - s(2), s(24), s(4));
  } else if (frameStyle === 'ribbon') {
    // パステルポップ: ふんわり二重丸枠 & 四隅のキラキラ星
    const pad = s(22);
    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.5);
    ctx.lineWidth = Math.max(2, s(3));
    drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, s(28));
    ctx.stroke();

    drawSparkleStar(ctx, s(48), s(48), s(14), theme.colors.accentPrimary);
    drawSparkleStar(ctx, width - s(52), s(52), s(16), theme.colors.accentSecondary);
    drawSparkleStar(ctx, s(52), height - s(52), s(14), theme.colors.accentSecondary);
    drawSparkleStar(ctx, width - s(48), height - s(48), s(14), theme.colors.accentPrimary);
    drawSparkleStar(ctx, width * 0.65, s(65), s(10), theme.colors.accentPrimary);
  } else if (frameStyle === 'modern') {
    // シンプルモダン: クリーンな細枠と上部アクセントバー
    const pad = s(24);
    ctx.strokeStyle = theme.colors.cardBorder;
    ctx.lineWidth = Math.max(1, s(2));
    drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, s(12));
    ctx.stroke();

    ctx.fillStyle = theme.colors.accentPrimary;
    ctx.fillRect(pad + s(40), pad - s(2), s(160), s(4));
    ctx.fillStyle = theme.colors.accentSecondary;
    ctx.fillRect(pad + s(208), pad - s(2), s(48), s(4));
  } else if (frameStyle === 'luxury') {
    // ダークシック: シャンパンゴールド二重額縁 & ダイヤオーナメント
    const outerPad = s(22);
    const innerPad = s(30);
    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.65);
    ctx.lineWidth = Math.max(1, s(2));
    drawRoundedRect(ctx, outerPad, outerPad, width - outerPad * 2, height - outerPad * 2, s(4));
    ctx.stroke();

    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentSecondary, 0.35);
    ctx.lineWidth = Math.max(1, s(1));
    drawRoundedRect(ctx, innerPad, innerPad, width - innerPad * 2, height - innerPad * 2, s(2));
    ctx.stroke();

    drawDiamond(ctx, outerPad, outerPad, s(8), theme.colors.accentPrimary);
    drawDiamond(ctx, width - outerPad, outerPad, s(8), theme.colors.accentPrimary);
    drawDiamond(ctx, outerPad, height - outerPad, s(8), theme.colors.accentPrimary);
    drawDiamond(ctx, width - outerPad, height - outerPad, s(8), theme.colors.accentPrimary);
  } else if (frameStyle === 'wafuu') {
    // 和風・桜ノスタルジー: 和モダン二重角枠 & 舞い散る桜花びらモチーフ
    const pad = s(24);
    const inner = s(32);
    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.6);
    ctx.lineWidth = Math.max(1, s(2));
    drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, s(6));
    ctx.stroke();

    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentSecondary, 0.45);
    ctx.lineWidth = Math.max(1, s(1.5));
    drawRoundedRect(ctx, inner, inner, width - inner * 2, height - inner * 2, s(4));
    ctx.stroke();

    // 桜の花びらモチーフ (背景の優美なアクセント)
    const petals = [
      { x: 0.12, y: 0.1, r: 9 },
      { x: 0.45, y: 0.08, r: 7 },
      { x: 0.72, y: 0.12, r: 10 },
      { x: 0.88, y: 0.18, r: 8 },
      { x: 0.93, y: 0.42, r: 11 },
      { x: 0.06, y: 0.55, r: 8 },
      { x: 0.64, y: 0.88, r: 9 },
      { x: 0.91, y: 0.82, r: 7 },
    ];
    ctx.fillStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.35);
    for (const p of petals) {
      ctx.beginPath();
      ctx.arc(Math.round(width * p.x), Math.round(height * p.y), s(p.r), 0, Math.PI * 1.6);
      ctx.closePath();
      ctx.fill();
    }
  } else if (frameStyle === 'galaxy') {
    // スターライト・ギャラクシー: 星座ライン & 煌めく星屑フレーム
    const pad = s(24);
    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.45);
    ctx.lineWidth = Math.max(1, s(2));
    drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, s(16));
    ctx.stroke();

    // 星座ライン
    const constellation = [
      { x: Math.round(width * 0.58), y: s(55) },
      { x: Math.round(width * 0.65), y: s(82) },
      { x: Math.round(width * 0.74), y: s(62) },
      { x: Math.round(width * 0.82), y: s(95) },
      { x: Math.round(width * 0.9), y: s(68) },
    ];
    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.3);
    ctx.lineWidth = Math.max(1, s(1.5));
    ctx.beginPath();
    for (let i = 0; i < constellation.length; i++) {
      if (i === 0) ctx.moveTo(constellation[i].x, constellation[i].y);
      else ctx.lineTo(constellation[i].x, constellation[i].y);
    }
    ctx.stroke();

    for (const pt of constellation) {
      drawSparkleStar(ctx, pt.x, pt.y, s(8), theme.colors.accentPrimary);
    }
    drawSparkleStar(ctx, s(48), s(48), s(12), theme.colors.accentPrimary);
    drawSparkleStar(ctx, width - s(48), height - s(48), s(12), theme.colors.accentSecondary);
  } else if (frameStyle === 'stitch') {
    // カフェ・ナチュラルルーム: カフェボード風ステッチ枠
    const pad = s(22);
    ctx.strokeStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.55);
    ctx.lineWidth = Math.max(2, s(3));
    if (typeof (ctx as { setLineDash?: (segments: number[]) => void }).setLineDash === 'function') {
      (ctx as { setLineDash: (segments: number[]) => void }).setLineDash([s(12), s(8)]);
    }
    drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, s(20));
    ctx.stroke();
    if (typeof (ctx as { setLineDash?: (segments: number[]) => void }).setLineDash === 'function') {
      (ctx as { setLineDash: (segments: number[]) => void }).setLineDash([]);
    }
  } else if (frameStyle === 'comic') {
    // ポップ・コミック Y2K: 太黒枠＋ポップシャドウフレーム
    const pad = s(22);
    // オフセット影枠
    ctx.fillStyle = applyAlphaToColor(theme.colors.accentPrimary, 0.25);
    drawRoundedRect(ctx, pad + s(6), pad + s(6), width - pad * 2, height - pad * 2, s(14));
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = Math.max(2, s(4));
    drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, s(14));
    ctx.stroke();

    drawSparkleStar(ctx, width - s(56), s(56), s(16), theme.colors.accentPrimary);
    drawSparkleStar(ctx, s(56), height - s(56), s(14), theme.colors.accentSecondary);
  }

  ctx.restore();
}

/**
 * 背景グラデーション、カスタム背景画像、および装飾パターンを描画する
 */
export function drawBackgroundAndPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ScheduleTheme,
  customBgImage?: CanvasImageSource | null,
  bgOverlayOpacity: number = 0.35,
  bgBlur: number = 0
): void {
  ctx.save();

  // 1. ベース背景グラデーション
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  const startColor = theme.colors.background;
  const endColor = theme.colors.bgGradientEnd ?? theme.colors.background;
  bgGradient.addColorStop(0, startColor);
  bgGradient.addColorStop(1, endColor);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. カスタム背景画像が指定されている場合はカバー描画 + ぼかし + 暗さオーバーレイ
  if (customBgImage) {
    const dims = getImageDimensions(customBgImage);
    if (dims) {
      ctx.save();
      const scaleFactor = width / 1920;
      if (bgBlur > 0 && 'filter' in ctx) {
        try {
          (ctx as CanvasRenderingContext2D & { filter: string }).filter = `blur(${Math.round(
            bgBlur * scaleFactor
          )}px)`;
        } catch {
          // filter non-supported fallback
        }
      }

      // アスペクト比を維持してキャンバス全体を埋める (object-fit: cover)
      const imgRatio = dims.width / dims.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        offsetX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgRatio;
        offsetY = (height - drawH) / 2;
      }

      ctx.drawImage(customBgImage, offsetX, offsetY, drawW, drawH);
      if ('filter' in ctx) {
        try {
          (ctx as CanvasRenderingContext2D & { filter: string }).filter = 'none';
        } catch {
          // ignore
        }
      }
      ctx.restore();

      // 可読性確保のための暗さオーバーレイ (0% 〜 80%)
      const clampedOverlay = Math.max(0, Math.min(0.85, bgOverlayOpacity));
      if (clampedOverlay > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(7, 10, 19, ${clampedOverlay})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  } else {
    // 3. 標準テンプレート背景グローエフェクト (右上のやわらかな発光)
    if (theme.colors.bgGlowColor) {
      try {
        const glow = ctx.createRadialGradient(
          width * 0.85,
          height * 0.2,
          20,
          width * 0.85,
          height * 0.2,
          width * 0.55
        );
        glow.addColorStop(0, theme.colors.bgGlowColor);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      } catch {
        // radial gradient mock fallback
      }
    }

    // 4. 装飾幾何学パターン
    const { patternType, patternOpacity } = theme.decorations;
    if (patternType !== 'none' && patternOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = patternOpacity;

      if (patternType === 'grid') {
        const step = 40;
        ctx.strokeStyle = theme.colors.accentPrimary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= width; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      } else if (patternType === 'dots') {
        const step = 36;
        const dotRadius = 2;
        ctx.fillStyle = theme.colors.accentPrimary;
        for (let x = step / 2; x < width; x += step) {
          for (let y = step / 2; y < height; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (patternType === 'stripes') {
        const step = 48;
        ctx.strokeStyle = theme.colors.accentPrimary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = -height; x <= width; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x + height, height);
        }
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // 5. テンプレート固有の装飾フレーム＆モチーフ描画
  drawTemplateFrameAndMotifs(ctx, width, height, theme);

  ctx.restore();
}

/**
 * ヘッダー領域（タイトル・日付・配信者名・推しマーク・プラットフォームバッジ・ハッシュタグ）を描画する
 */
export function drawHeader(
  ctx: CanvasRenderingContext2D,
  schedule: ScheduleData,
  theme: ScheduleTheme,
  scale: number,
  headerLayout?: CalculatedLayout['header']
): void {
  ctx.save();
  ctx.textBaseline = 'top';

  const marginX = headerLayout?.titleX ?? Math.round(60 * scale);
  const startY = Math.round(48 * scale);

  // 1. タイトル横のアクセントバー
  ctx.fillStyle = theme.colors.headerAccent;
  const barWidth = Math.round(6 * scale);
  const barHeight = Math.round(48 * scale);
  drawRoundedRect(ctx, marginX, startY, barWidth, barHeight, Math.round(3 * scale));
  ctx.fill();

  // 2. メインタイトル (WEEKLY SCHEDULE 等)
  ctx.font = `bold ${Math.round(42 * scale)}px ${theme.typography.titleFont}`;
  ctx.fillStyle = theme.colors.accentPrimary;
  const titleX = marginX + barWidth + Math.round(16 * scale);
  ctx.fillText(schedule.weekTitle || 'WEEKLY SCHEDULE', titleX, startY);

  // 3. 期間テキスト (2026.10.19 - 10.25)
  const titleMetrics = ctx.measureText
    ? ctx.measureText(schedule.weekTitle || 'WEEKLY SCHEDULE')
    : { width: 400 * scale };
  const periodX = titleX + titleMetrics.width + Math.round(24 * scale);
  ctx.font = `600 ${Math.round(22 * scale)}px ${theme.typography.dayFont}`;
  ctx.fillStyle = theme.colors.textSecondary;
  ctx.fillText(schedule.weekPeriodText || '', periodX, startY + Math.round(16 * scale));

  // 4. 配信者名 & 推しマーク & Xアカウント & プラットフォームバッジ
  const streamerY = startY + Math.round(56 * scale);
  const displayName = schedule.fanMark
    ? `${schedule.streamerName || ''} ${schedule.fanMark}`.trim()
    : schedule.streamerName || '';

  ctx.font = `bold ${Math.round(24 * scale)}px ${theme.typography.bodyFont}`;
  ctx.fillStyle = theme.colors.textPrimary;
  ctx.fillText(displayName, titleX, streamerY);

  let currentX = titleX;
  const nameMetrics = ctx.measureText ? ctx.measureText(displayName) : { width: 140 * scale };
  currentX += nameMetrics.width + Math.round(14 * scale);

  if (schedule.streamerHandle) {
    ctx.font = `500 ${Math.round(18 * scale)}px ${theme.typography.dayFont}`;
    ctx.fillStyle = theme.colors.textSecondary;
    ctx.fillText(schedule.streamerHandle, currentX, streamerY + Math.round(4 * scale));
    const handleMetrics = ctx.measureText
      ? ctx.measureText(schedule.streamerHandle)
      : { width: 90 * scale };
    currentX += handleMetrics.width + Math.round(14 * scale);
  }

  // 配信先プラットフォームバッジ描画
  if (Array.isArray(schedule.platforms) && schedule.platforms.length > 0) {
    const badgeH = Math.round(22 * scale);
    const badgeY = streamerY + Math.round(3 * scale);
    ctx.font = `bold ${Math.round(12 * scale)}px ${theme.typography.bodyFont}`;

    for (const platform of schedule.platforms) {
      if (!platform) continue;
      const pColors = PLATFORM_BADGE_COLORS[platform] ?? {
        bg: theme.colors.accentPrimary,
        text: theme.colors.timeBadgeText,
      };
      const pMetrics = ctx.measureText ? ctx.measureText(platform) : { width: platform.length * 10 * scale };
      const badgeW = pMetrics.width + Math.round(16 * scale);

      drawRoundedRect(ctx, currentX, badgeY, badgeW, badgeH, Math.round(6 * scale));
      ctx.fillStyle = pColors.bg;
      ctx.fill();

      ctx.fillStyle = pColors.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(platform, currentX + badgeW / 2, badgeY + badgeH / 2);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      currentX += badgeW + Math.round(8 * scale);
    }
  }

  // 5. ハッシュタグ
  if (schedule.hashtag) {
    ctx.font = `500 ${Math.round(16 * scale)}px ${theme.typography.bodyFont}`;
    ctx.fillStyle = theme.colors.accentSecondary;
    ctx.fillText(schedule.hashtag, titleX, streamerY + Math.round(32 * scale));
  }

  ctx.restore();
}

/**
 * 7日分のスケジュールカードを描画する
 */
export function drawScheduleCards(
  ctx: CanvasRenderingContext2D,
  schedule: ScheduleData,
  theme: ScheduleTheme,
  cards: ReturnType<typeof calculateLayout>['cards'],
  scale: number
): void {
  const cornerRadius = Math.round(theme.decorations.cardCornerRadius * scale);

  for (const card of cards) {
    // インデックス順を優先しつつ、必要に応じて曜日一致でフォールバック（日曜始まり・任意日始まりにも完全対応）
    const item =
      schedule.items[card.index] ??
      schedule.items.find((it) => it.dayOfWeek === card.dayOfWeek);
    if (!item) continue;

    const itemDay: DayOfWeek = item.dayOfWeek || card.dayOfWeek;
    const isWeekend = itemDay === 'SAT' || itemDay === 'SUN';

    ctx.save();

    // 1. カード背景 & 影
    drawRoundedRect(ctx, card.x, card.y, card.width, card.height, cornerRadius);
    ctx.fillStyle = theme.colors.cardBg;

    if (theme.decorations.cardGlow) {
      ctx.shadowColor = isWeekend
        ? theme.colors.accentSecondary
        : (theme.colors.cardShadow ?? theme.colors.accentPrimary);
      ctx.shadowBlur = Math.round(12 * scale);
    }
    ctx.fill();

    // 影リセット
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 2. カード枠線
    ctx.strokeStyle = isWeekend ? theme.colors.accentSecondary : theme.colors.cardBorder;
    ctx.lineWidth = Math.max(1, Math.round(2 * scale));
    ctx.stroke();

    // 3. 曜日ヘッダー領域 (カード上部)
    const paddingX = Math.round(14 * scale);
    const paddingTop = Math.round(14 * scale);

    // 曜日バッジ (例: MON / 月)
    const badgeHeight = Math.round(26 * scale);
    const badgeWidth = Math.round(52 * scale);
    drawRoundedRect(
      ctx,
      card.x + paddingX,
      card.y + paddingTop,
      badgeWidth,
      badgeHeight,
      Math.round(6 * scale)
    );
    ctx.fillStyle = isWeekend ? theme.colors.accentSecondary : theme.colors.accentPrimary;
    ctx.fill();

    // 曜日テキスト
    ctx.font = `bold ${Math.round(14 * scale)}px ${theme.typography.dayFont}`;
    ctx.fillStyle = isWeekend ? '#ffffff' : theme.colors.timeBadgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      itemDay,
      card.x + paddingX + badgeWidth / 2,
      card.y + paddingTop + badgeHeight / 2
    );

    // 日付 (例: 10/19)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(18 * scale)}px ${theme.typography.dayFont}`;
    ctx.fillStyle = theme.colors.textSecondary;
    ctx.fillText(
      item.dateString,
      card.x + paddingX + badgeWidth + Math.round(10 * scale),
      card.y + paddingTop + badgeHeight / 2
    );

    // 曜日日本語表記 (月)
    const dayJa = DAY_OF_WEEK_JA[itemDay] ?? '';
    ctx.font = `500 ${Math.round(14 * scale)}px ${theme.typography.bodyFont}`;
    ctx.fillText(
      `(${dayJa})`,
      card.x + paddingX + badgeWidth + Math.round(66 * scale),
      card.y + paddingTop + badgeHeight / 2
    );

    // 特別バッジ (例: コラボ / 重大告知)
    if (item.badgeText && !item.isOff) {
      const specialBadgePadding = Math.round(8 * scale);
      ctx.font = `bold ${Math.round(12 * scale)}px ${theme.typography.bodyFont}`;
      const specialMetrics = ctx.measureText
        ? ctx.measureText(item.badgeText)
        : { width: 40 * scale };
      const specialBadgeWidth = specialMetrics.width + specialBadgePadding * 2;
      const specialBadgeX = card.x + card.width - paddingX - specialBadgeWidth;

      drawRoundedRect(
        ctx,
        specialBadgeX,
        card.y + paddingTop,
        specialBadgeWidth,
        badgeHeight,
        Math.round(6 * scale)
      );
      ctx.fillStyle = theme.colors.accentSecondary;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        item.badgeText,
        specialBadgeX + specialBadgeWidth / 2,
        card.y + paddingTop + badgeHeight / 2
      );
    }

    // 4. カード本文領域
    if (item.isOff) {
      // --- お休みの日カード ---
      const offBadgeWidth = Math.round(120 * scale);
      const offBadgeHeight = Math.round(42 * scale);
      const offCenterX = card.x + card.width / 2;
      const offCenterY = card.y + card.height * 0.45;

      drawRoundedRect(
        ctx,
        offCenterX - offBadgeWidth / 2,
        offCenterY - offBadgeHeight / 2,
        offBadgeWidth,
        offBadgeHeight,
        Math.round(8 * scale)
      );
      ctx.fillStyle = theme.colors.offDayBadgeBg;
      ctx.fill();
      ctx.strokeStyle = theme.colors.offDayBadgeText;
      ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
      ctx.stroke();

      ctx.font = `bold ${Math.round(20 * scale)}px ${theme.typography.titleFont}`;
      ctx.fillStyle = theme.colors.offDayBadgeText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OFF', offCenterX, offCenterY);

      // お休みコメント (例: 動画編集Day)
      if (item.title) {
        ctx.font = `500 ${Math.round(15 * scale)}px ${theme.typography.bodyFont}`;
        ctx.fillStyle = theme.colors.textSecondary;
        ctx.fillText(item.title, offCenterX, offCenterY + Math.round(38 * scale));
      }
    } else {
      // --- 通常配信日カード ---
      let contentY = card.y + paddingTop + badgeHeight + Math.round(14 * scale);

      // 配信時刻バッジ (例: 21:00〜)
      if (item.timeString && item.timeString !== '—') {
        ctx.font = `bold ${Math.round(14 * scale)}px ${theme.typography.dayFont}`;
        const timeMetrics = ctx.measureText
          ? ctx.measureText(item.timeString)
          : { width: 50 * scale };
        const timeBadgeW = timeMetrics.width + Math.round(16 * scale);
        const timeBadgeH = Math.round(24 * scale);

        drawRoundedRect(
          ctx,
          card.x + paddingX,
          contentY,
          timeBadgeW,
          timeBadgeH,
          Math.round(4 * scale)
        );
        ctx.fillStyle = theme.colors.timeBadgeBg;
        ctx.fill();

        ctx.fillStyle = theme.colors.timeBadgeText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          item.timeString,
          card.x + paddingX + timeBadgeW / 2,
          contentY + timeBadgeH / 2
        );

        // カテゴリタグ (例: ゲーム / 雑談)
        const catConfig = theme.colors.categoryBadgeColors[item.category] ?? {
          bg: 'rgba(255, 255, 255, 0.2)',
          text: theme.colors.textPrimary,
        };
        const catLabel = CATEGORY_LABELS[item.category] ?? item.category;
        ctx.font = `600 ${Math.round(12 * scale)}px ${theme.typography.bodyFont}`;
        const catMetrics = ctx.measureText ? ctx.measureText(catLabel) : { width: 30 * scale };
        const catBadgeW = catMetrics.width + Math.round(14 * scale);
        const catBadgeX = card.x + paddingX + timeBadgeW + Math.round(8 * scale);

        drawRoundedRect(
          ctx,
          catBadgeX,
          contentY,
          catBadgeW,
          timeBadgeH,
          Math.round(4 * scale)
        );
        ctx.fillStyle = catConfig.bg;
        ctx.fill();

        ctx.fillStyle = catConfig.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(catLabel, catBadgeX + catBadgeW / 2, contentY + timeBadgeH / 2);

        contentY += timeBadgeH + Math.round(16 * scale);
      }

      // 配信タイトル (自動折り返し & 文字数に応じた調整)
      const titleMaxWidth = card.width - paddingX * 2;
      const titleLines = wrapText(ctx, item.title, titleMaxWidth, 3);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = theme.colors.textPrimary;
      const fontSize = Math.round(19 * scale);
      const lineHeight = Math.round(27 * scale);
      ctx.font = `600 ${fontSize}px ${theme.typography.bodyFont}`;

      for (let lineIdx = 0; lineIdx < titleLines.length; lineIdx++) {
        ctx.fillText(titleLines[lineIdx], card.x + paddingX, contentY + lineIdx * lineHeight);
      }
    }

    ctx.restore();
  }
}

/**
 * フッター・クレジット透かし（Created with StreamSchedule (@poeenn)）を描画する
 */
export function drawCredit(
  ctx: CanvasRenderingContext2D,
  theme: ScheduleTheme,
  position: { x: number; y: number },
  scale: number
): void {
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.font = `500 ${Math.round(15 * scale)}px ${theme.typography.dayFont}`;
  ctx.fillStyle = theme.colors.creditText;
  ctx.fillText('Created with StreamSchedule (@poeenn)', position.x, position.y);
  ctx.restore();
}

/**
 * CanvasRenderingContext2D に対するスケジュール画像の一連のレンダリングパイプラインを実行する
 */
export async function renderScheduleToContext(
  ctx: CanvasRenderingContext2D,
  schedule: ScheduleData,
  themeArg?: ScheduleTheme,
  avatarImage?: CanvasImageSource | null,
  options?: RenderScheduleOptions
): Promise<void> {
  const baseTheme = themeArg ?? getThemeById(schedule.themeId ?? 'cyber-neon');
  const effectiveTheme = resolveEffectiveTheme(baseTheme, schedule);
  const resolution = options?.resolution ?? schedule.resolution ?? '1920x1080';
  const showCredit = options?.showCredit ?? schedule.showCredit ?? true;
  const layoutType = options?.layoutType ?? schedule.layoutType ?? 'side-avatar';

  const layout = calculateLayout(resolution, {
    layoutType,
    showCredit,
  });

  const scale = layout.canvasWidth / 1920;

  // 1. フォント待機 (ブラウザ環境時のみ安全に実行)
  if (typeof document !== 'undefined' && document?.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // フォント未準備時もスキップして続行
    }
  }

  // 2. 背景グラデーション・カスタム背景・装飾フレーム描画
  drawBackgroundAndPattern(
    ctx,
    layout.canvasWidth,
    layout.canvasHeight,
    effectiveTheme,
    options?.customBgImage ?? null,
    schedule.bgOverlayOpacity ?? 0.35,
    schedule.bgBlur ?? 0
  );

  // 3. 立ち絵（アバター）合成描画 (wide-grid 以外のとき、または明示的に指定された場合)
  if (avatarImage && layoutType !== 'wide-grid') {
    drawAvatar(ctx, avatarImage, options?.avatarConfig, layout.avatarArea, {
      enableDimmerMask: options?.enableDimmerMask ?? true,
      dimmerColor: effectiveTheme.colors.background,
      dimmerDirection: layoutType === 'left-avatar' ? 'to-right' : 'to-left',
    });
  }

  // 4. ヘッダー描画
  drawHeader(ctx, schedule, effectiveTheme, scale, layout.header);

  // 5. 7日分配信枠カード描画
  drawScheduleCards(ctx, schedule, effectiveTheme, layout.cards, scale);

  // 6. クレジット透かし描画
  if (showCredit) {
    drawCredit(ctx, effectiveTheme, layout.creditPosition, scale);
  }
}

/**
 * 指定された HTMLCanvasElement 上に週間スケジュール告知画像を描画するエントリーポイント
 */
export async function renderScheduleToCanvas(
  canvas: HTMLCanvasElement,
  schedule: ScheduleData,
  theme?: ScheduleTheme,
  avatarImage?: CanvasImageSource | null,
  options?: RenderScheduleOptions
): Promise<void> {
  if (!canvas) {
    throw new Error('Canvas element is required for rendering');
  }

  const resolution = options?.resolution ?? schedule.resolution ?? '1920x1080';
  const targetWidth = resolution === '1200x675' ? 1200 : 1920;
  const targetHeight = resolution === '1200x675' ? 675 : 1080;

  // キャンバス解像度を適用
  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  if (canvas.height !== targetHeight) canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to obtain CanvasRenderingContext2D');
  }

  await renderScheduleToContext(ctx, schedule, theme, avatarImage, options);
}
