import { ScheduleData, DayOfWeek, StreamCategory, CharacterImageConfig } from '../types/schedule';
import { ScheduleTheme } from '../types/theme';
import { RenderOptions } from '../types/canvas';
import { calculateLayout } from './layout-calculator';
import { drawAvatar } from './avatar-compositor';
import { getThemeById } from '../themes';

export interface RenderScheduleOptions extends Partial<RenderOptions> {
  avatarConfig?: CharacterImageConfig;
  enableDimmerMask?: boolean;
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
  const r = Math.min(radius, width / 2, height / 2);
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
 * 背景グラデーションおよび装飾幾何学パターンを描画する
 */
export function drawBackgroundAndPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ScheduleTheme
): void {
  ctx.save();

  // 1. ベース背景グラデーション
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  if (theme.id === 'cyber-neon') {
    bgGradient.addColorStop(0, '#070a13');
    bgGradient.addColorStop(1, '#0d1527');
  } else if (theme.id === 'pastel-pop') {
    bgGradient.addColorStop(0, '#fff9fa');
    bgGradient.addColorStop(1, '#fdf2f4');
  } else if (theme.id === 'simple-modern') {
    bgGradient.addColorStop(0, '#f8fafc');
    bgGradient.addColorStop(1, '#edf2f7');
  } else if (theme.id === 'dark-chic') {
    bgGradient.addColorStop(0, '#121316');
    bgGradient.addColorStop(1, '#1a1b1f');
  } else {
    bgGradient.addColorStop(0, theme.colors.background);
    bgGradient.addColorStop(1, theme.colors.background);
  }
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. 背景グローエフェクト (右上のやわらかな発光)
  if (theme.colors.bgGlowColor) {
    try {
      const glow = ctx.createRadialGradient(
        width * 0.85,
        height * 0.2,
        20,
        width * 0.85,
        height * 0.2,
        width * 0.5
      );
      glow.addColorStop(0, theme.colors.bgGlowColor);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } catch {
      // radial gradient mock fallback
    }
  }

  // 3. 装飾幾何学パターン
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
      const step = 32;
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

  ctx.restore();
}

/**
 * ヘッダー領域（タイトル・日付・配信者名・ハッシュタグ）を描画する
 */
export function drawHeader(
  ctx: CanvasRenderingContext2D,
  schedule: ScheduleData,
  theme: ScheduleTheme,
  scale: number
): void {
  ctx.save();
  ctx.textBaseline = 'top';

  const marginX = Math.round(60 * scale);
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
  const titleMetrics = ctx.measureText ? ctx.measureText(schedule.weekTitle || 'WEEKLY SCHEDULE') : { width: 400 * scale };
  const periodX = titleX + titleMetrics.width + Math.round(24 * scale);
  ctx.font = `600 ${Math.round(22 * scale)}px ${theme.typography.dayFont}`;
  ctx.fillStyle = theme.colors.textSecondary;
  ctx.fillText(schedule.weekPeriodText || '', periodX, startY + Math.round(16 * scale));

  // 4. 配信者名 & Xアカウント
  const streamerY = startY + Math.round(56 * scale);
  ctx.font = `bold ${Math.round(24 * scale)}px ${theme.typography.bodyFont}`;
  ctx.fillStyle = theme.colors.textPrimary;
  ctx.fillText(schedule.streamerName || '', titleX, streamerY);

  if (schedule.streamerHandle) {
    const nameMetrics = ctx.measureText ? ctx.measureText(schedule.streamerName || '') : { width: 120 * scale };
    ctx.font = `500 ${Math.round(18 * scale)}px ${theme.typography.dayFont}`;
    ctx.fillStyle = theme.colors.textSecondary;
    ctx.fillText(schedule.streamerHandle, titleX + nameMetrics.width + Math.round(14 * scale), streamerY + Math.round(4 * scale));
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
    const item = schedule.items.find((it) => it.dayOfWeek === card.dayOfWeek) ?? schedule.items[card.index];
    if (!item) continue;

    ctx.save();

    // 1. カード背景 & 影
    drawRoundedRect(ctx, card.x, card.y, card.width, card.height, cornerRadius);
    ctx.fillStyle = theme.colors.cardBg;

    if (theme.decorations.cardGlow) {
      ctx.shadowColor = card.isWeekend
        ? theme.colors.accentSecondary
        : (theme.colors.cardShadow ?? theme.colors.accentPrimary);
      ctx.shadowBlur = Math.round(12 * scale);
    }
    ctx.fill();

    // 影リセット
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 2. カード枠線
    ctx.strokeStyle = card.isWeekend ? theme.colors.accentSecondary : theme.colors.cardBorder;
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
    ctx.fillStyle = card.isWeekend ? theme.colors.accentSecondary : theme.colors.accentPrimary;
    ctx.fill();

    // 曜日テキスト
    ctx.font = `bold ${Math.round(14 * scale)}px ${theme.typography.dayFont}`;
    ctx.fillStyle = card.isWeekend ? '#ffffff' : theme.colors.timeBadgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      card.dayOfWeek,
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
    const dayJa = DAY_OF_WEEK_JA[card.dayOfWeek];
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
      const specialMetrics = ctx.measureText ? ctx.measureText(item.badgeText) : { width: 40 * scale };
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
        const timeMetrics = ctx.measureText ? ctx.measureText(item.timeString) : { width: 50 * scale };
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
        ctx.fillText(
          catLabel,
          catBadgeX + catBadgeW / 2,
          contentY + timeBadgeH / 2
        );

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
  const theme = themeArg ?? getThemeById(schedule.themeId ?? 'cyber-neon');
  const resolution = options?.resolution ?? schedule.resolution ?? '1920x1080';
  const showCredit = options?.showCredit ?? schedule.showCredit ?? true;
  const layout = calculateLayout(resolution, {
    layoutType: options?.layoutType ?? 'side-avatar',
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

  // 2. 背景グラデーション & パターン描画
  drawBackgroundAndPattern(ctx, layout.canvasWidth, layout.canvasHeight, theme);

  // 3. 立ち絵（アバター）合成描画
  if (avatarImage) {
    drawAvatar(ctx, avatarImage, options?.avatarConfig, layout.avatarArea, {
      enableDimmerMask: options?.enableDimmerMask ?? true,
      dimmerColor: theme.colors.background,
    });
  }

  // 4. ヘッダー描画
  drawHeader(ctx, schedule, theme, scale);

  // 5. 7日分配信枠カード描画
  drawScheduleCards(ctx, schedule, theme, layout.cards, scale);

  // 6. クレジット透かし描画
  if (showCredit) {
    drawCredit(ctx, theme, layout.creditPosition, scale);
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
