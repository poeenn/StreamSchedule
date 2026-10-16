import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../src/core/layout-calculator';
import { CardRect } from '../src/types/canvas';

// 矩形同士の重なり（衝突）を判定する幾何ユーティリティ
function checkRectsOverlap(a: CardRect, b: CardRect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

describe('layout-calculator', () => {
  describe('1920x1080 (Full HD)', () => {
    it('calculates valid layout within 1920x1080 boundaries', () => {
      const layout = calculateLayout('1920x1080');

      expect(layout.canvasWidth).toBe(1920);
      expect(layout.canvasHeight).toBe(1080);
      expect(layout.cards).toHaveLength(7);

      // 全カードがキャンバス内に収まること
      for (const card of layout.cards) {
        expect(card.x).toBeGreaterThanOrEqual(0);
        expect(card.y).toBeGreaterThanOrEqual(0);
        expect(card.width).toBeGreaterThan(0);
        expect(card.height).toBeGreaterThan(0);
        expect(card.x + card.width).toBeLessThanOrEqual(1920);
        expect(card.y + card.height).toBeLessThanOrEqual(1080);
      }

      // カード同士の重なりがないこと
      for (let i = 0; i < layout.cards.length; i++) {
        for (let j = i + 1; j < layout.cards.length; j++) {
          const overlap = checkRectsOverlap(layout.cards[i], layout.cards[j]);
          expect(overlap).toBe(false);
        }
      }

      // 週末判定フラグの検証
      expect(layout.cards[0].isWeekend).toBe(false); // MON
      expect(layout.cards[4].isWeekend).toBe(false); // FRI
      expect(layout.cards[5].isWeekend).toBe(true);  // SAT
      expect(layout.cards[6].isWeekend).toBe(true);  // SUN

      // 立ち絵エリアの検証
      expect(layout.avatarArea.x + layout.avatarArea.width).toBeLessThanOrEqual(1920);
      expect(layout.avatarArea.y + layout.avatarArea.height).toBeLessThanOrEqual(1080);

      // クレジット位置の検証 (右下付近)
      expect(layout.creditPosition.x).toBeGreaterThan(1500);
      expect(layout.creditPosition.y).toBeGreaterThan(1000);
    });
  });

  describe('1200x675 (X/Twitter Optimized)', () => {
    it('calculates valid scaled layout within 1200x675 boundaries', () => {
      const layout = calculateLayout('1200x675');

      expect(layout.canvasWidth).toBe(1200);
      expect(layout.canvasHeight).toBe(675);
      expect(layout.cards).toHaveLength(7);

      // 全カードが境界内に収まること
      for (const card of layout.cards) {
        expect(card.x).toBeGreaterThanOrEqual(0);
        expect(card.y).toBeGreaterThanOrEqual(0);
        expect(card.x + card.width).toBeLessThanOrEqual(1200);
        expect(card.y + card.height).toBeLessThanOrEqual(675);
      }

      // 重なりがないこと
      for (let i = 0; i < layout.cards.length; i++) {
        for (let j = i + 1; j < layout.cards.length; j++) {
          expect(checkRectsOverlap(layout.cards[i], layout.cards[j])).toBe(false);
        }
      }

      // 1920x1080 比率 (0.625) との整合性 (整数ピクセル丸め誤差 ±1px 以内)
      const fullLayout = calculateLayout('1920x1080');
      const scale = 1200 / 1920; // 0.625
      expect(layout.cards[0].width).toBeCloseTo(fullLayout.cards[0].width * scale, 0);
      expect(layout.cards[0].height).toBeCloseTo(fullLayout.cards[0].height * scale, 0);
    });
  });

  describe('Layout Options (wide-grid)', () => {
    it('adjusts card sizes when wide-grid is selected without avatar area reservation', () => {
      const sideLayout = calculateLayout('1920x1080', { layoutType: 'side-avatar' });
      const wideLayout = calculateLayout('1920x1080', { layoutType: 'wide-grid' });

      // wide-grid の方がカード幅が広い
      expect(wideLayout.cards[0].width).toBeGreaterThan(sideLayout.cards[0].width);

      // wide-grid でも重なりがなく境界内
      for (const card of wideLayout.cards) {
        expect(card.x + card.width).toBeLessThanOrEqual(1920);
        expect(card.y + card.height).toBeLessThanOrEqual(1080);
      }
      for (let i = 0; i < wideLayout.cards.length; i++) {
        for (let j = i + 1; j < wideLayout.cards.length; j++) {
          expect(checkRectsOverlap(wideLayout.cards[i], wideLayout.cards[j])).toBe(false);
        }
      }
    });
  });
});
