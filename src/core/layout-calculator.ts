import { DayOfWeek, ResolutionPreset } from '../types/schedule';
import { CalculatedLayout, CardRect, RenderOptions } from '../types/canvas';

const DAYS_OF_WEEK: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * 解像度とレイアウトオプションに応じた座標計算を行う純粋関数
 * 1920x1080 を基準値として幾何計算し、指定解像度に合わせてスケーリングします。
 */
export function calculateLayout(
  resolution: ResolutionPreset,
  options?: RenderOptions | { layoutType?: 'side-avatar' | 'wide-grid'; showCredit?: boolean }
): CalculatedLayout {
  const is1200 = resolution === '1200x675';
  const targetWidth = is1200 ? 1200 : 1920;
  const targetHeight = is1200 ? 675 : 1080;
  const scale = targetWidth / 1920; // 1.0 または 0.625

  const layoutType = options?.layoutType ?? 'side-avatar';

  // 1920x1080 基準座標系での計算
  const baseMarginX = 60;
  const baseStartY = 190;
  const baseBottomMargin = 40;
  const baseAvailableHeight = 1080 - baseStartY - baseBottomMargin; // 850px
  const baseGapY = 24;
  const baseCardHeight = (baseAvailableHeight - baseGapY) / 2; // 413px

  let baseAvailableWidth: number;
  let baseGapX: number;
  let baseCardWidthTop: number;
  let baseCardWidthBottom: number;
  let baseAvatarArea: { x: number; y: number; width: number; height: number };

  if (layoutType === 'side-avatar') {
    // 左側: スケジュールグリッド (幅 1180px), 右側: 立ち絵エリア (幅 600px)
    baseAvailableWidth = 1180;
    baseGapX = 20;
    baseCardWidthTop = (baseAvailableWidth - 3 * baseGapX) / 4; // 280px
    baseCardWidthBottom = (baseAvailableWidth - 2 * baseGapX) / 3; // 380px
    baseAvatarArea = {
      x: 1260,
      y: 140,
      width: 600,
      height: 900,
    };
  } else {
    // wide-grid: 全画面グリッド (幅 1800px)
    baseAvailableWidth = 1800;
    baseGapX = 24;
    baseCardWidthTop = (baseAvailableWidth - 3 * baseGapX) / 4; // 432px
    baseCardWidthBottom = (baseAvailableWidth - 2 * baseGapX) / 3; // 584px
    baseAvatarArea = {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    };
  }

  // 7日分のカード座標計算
  const baseCards: CardRect[] = [];

  // 上段: 月〜木 (index 0..3)
  for (let i = 0; i < 4; i++) {
    baseCards.push({
      index: i,
      dayOfWeek: DAYS_OF_WEEK[i],
      x: baseMarginX + i * (baseCardWidthTop + baseGapX),
      y: baseStartY,
      width: baseCardWidthTop,
      height: baseCardHeight,
      isWeekend: false,
    });
  }

  // 下段: 金〜日 (index 4..6)
  for (let i = 4; i < 7; i++) {
    const bottomIndex = i - 4;
    baseCards.push({
      index: i,
      dayOfWeek: DAYS_OF_WEEK[i],
      x: baseMarginX + bottomIndex * (baseCardWidthBottom + baseGapX),
      y: baseStartY + baseCardHeight + baseGapY,
      width: baseCardWidthBottom,
      height: baseCardHeight,
      isWeekend: i >= 5, // SAT(5), SUN(6) は true
    });
  }

  // スケール適用関数 (丸め誤差によるキャンバスはみ出し防止)
  const s = (v: number) => Math.round(v * scale);

  const scaledCards: CardRect[] = baseCards.map((card) => ({
    index: card.index,
    dayOfWeek: card.dayOfWeek,
    x: s(card.x),
    y: s(card.y),
    width: s(card.width),
    height: s(card.height),
    isWeekend: card.isWeekend,
  }));

  const calculated: CalculatedLayout = {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    header: {
      titleX: s(60),
      titleY: s(100),
      streamerX: s(60),
      streamerY: s(150),
      periodX: s(800),
      periodY: s(100),
      height: s(130),
    },
    cards: scaledCards,
    avatarArea: {
      x: s(baseAvatarArea.x),
      y: s(baseAvatarArea.y),
      width: s(baseAvatarArea.width),
      height: s(baseAvatarArea.height),
    },
    creditPosition: {
      x: s(1860),
      y: s(1055),
    },
  };

  return calculated;
}
