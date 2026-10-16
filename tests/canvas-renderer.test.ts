import { describe, it, expect, vi } from 'vitest';
import {
  renderScheduleToContext,
  renderScheduleToCanvas,
  drawRoundedRect,
  wrapText,
  DAY_OF_WEEK_JA,
  CATEGORY_LABELS,
} from '../src/core/canvas-renderer';
import { DEFAULT_SCHEDULE_DATA } from '../src/constants/default-schedule';
import { THEMES, getThemeById } from '../src/themes';
import { ScheduleData, DayOfWeek, StreamCategory } from '../src/types/schedule';

describe('Canvas Renderer', () => {
  function createMockContext() {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockImplementation((text: string) => ({
        width: text.length * 10,
      })),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1.0,
    } as unknown as CanvasRenderingContext2D;
  }

  describe('Helper Functions & Constants', () => {
    it('defines Japanese labels for all 7 days of the week', () => {
      const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      for (const d of days) {
        expect(DAY_OF_WEEK_JA[d]).toBeTruthy();
      }
    });

    it('defines labels for all 7 stream categories', () => {
      const categories: StreamCategory[] = [
        'game',
        'chat',
        'sing',
        'collab',
        'event',
        'holiday',
        'other',
      ];
      for (const cat of categories) {
        expect(CATEGORY_LABELS[cat]).toBeTruthy();
      }
    });

    it('drawRoundedRect uses native roundRect when available', () => {
      const ctx = createMockContext();
      (ctx as unknown as { roundRect: ReturnType<typeof vi.fn> }).roundRect = vi.fn();

      drawRoundedRect(ctx, 10, 20, 100, 50, 8);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect((ctx as unknown as { roundRect: ReturnType<typeof vi.fn> }).roundRect).toHaveBeenCalledWith(
        10,
        20,
        100,
        50,
        8
      );
    });

    it('drawRoundedRect uses arcTo fallback when roundRect is undefined', () => {
      const ctx = createMockContext();
      // roundRect is not defined in mock context
      drawRoundedRect(ctx, 10, 20, 100, 50, 8);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.arcTo).toHaveBeenCalled();
      expect(ctx.closePath).toHaveBeenCalled();
    });

    describe('wrapText', () => {
      it('returns empty array for empty string', () => {
        const ctx = createMockContext();
        expect(wrapText(ctx, '', 200)).toEqual([]);
      });

      it('returns single line if text fits within maxWidth', () => {
        const ctx = createMockContext();
        // 5 chars * 10 = 50px < 100px
        const lines = wrapText(ctx, 'Short', 100);
        expect(lines).toEqual(['Short']);
      });

      it('wraps long text across multiple lines', () => {
        const ctx = createMockContext();
        // 20 chars = 200px > 80px
        const lines = wrapText(ctx, '12345678901234567890', 80, 3);
        expect(lines.length).toBeGreaterThan(1);
        expect(lines.length).toBeLessThanOrEqual(3);
      });

      it('appends ellipsis on final line when exceeding maxLines', () => {
        const ctx = createMockContext();
        // Very long string
        const longText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
        const lines = wrapText(ctx, longText, 50, 2);
        expect(lines.length).toBe(2);
        expect(lines[1].endsWith('…')).toBe(true);
      });
    });
  });

  describe('renderScheduleToContext Pipeline', () => {
    it.each(THEMES)('renders successfully for theme: $name ($id)', async (theme) => {
      const ctx = createMockContext();
      await renderScheduleToContext(ctx, DEFAULT_SCHEDULE_DATA, theme);

      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('renders successfully for both 1920x1080 and 1200x675 resolutions', async () => {
      const ctx1920 = createMockContext();
      await renderScheduleToContext(ctx1920, {
        ...DEFAULT_SCHEDULE_DATA,
        resolution: '1920x1080',
      });
      expect(ctx1920.fillRect).toHaveBeenCalled();

      const ctx1200 = createMockContext();
      await renderScheduleToContext(ctx1200, {
        ...DEFAULT_SCHEDULE_DATA,
        resolution: '1200x675',
      });
      expect(ctx1200.fillRect).toHaveBeenCalled();
    });

    it('draws credit watermark when showCredit is true', async () => {
      const ctx = createMockContext();
      await renderScheduleToContext(ctx, DEFAULT_SCHEDULE_DATA, undefined, null, {
        showCredit: true,
      });

      const fillTextCalls = (ctx.fillText as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      const creditDrawn = fillTextCalls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('Created with StreamSchedule (@poeenn)')
      );
      expect(creditDrawn).toBe(true);
    });

    it('skips credit watermark when showCredit is false', async () => {
      const ctx = createMockContext();
      await renderScheduleToContext(ctx, DEFAULT_SCHEDULE_DATA, undefined, null, {
        showCredit: false,
      });

      const fillTextCalls = (ctx.fillText as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      const creditDrawn = fillTextCalls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('Created with StreamSchedule')
      );
      expect(creditDrawn).toBe(false);
    });

    it('draws OFF badge when schedule item has isOff = true', async () => {
      const ctx = createMockContext();
      const testSchedule: ScheduleData = {
        ...DEFAULT_SCHEDULE_DATA,
        items: [
          {
            id: 'mon',
            dayOfWeek: 'MON',
            dateString: '10/19',
            timeString: '—',
            title: '完全休養日',
            category: 'holiday',
            isOff: true,
          },
          ...DEFAULT_SCHEDULE_DATA.items.slice(1),
        ],
      };

      await renderScheduleToContext(ctx, testSchedule);

      const fillTextCalls = (ctx.fillText as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      const offDrawn = fillTextCalls.some(
        (call) => typeof call[0] === 'string' && call[0] === 'OFF'
      );
      expect(offDrawn).toBe(true);
    });

    it('synthesizes avatar image when provided', async () => {
      const ctx = createMockContext();
      const mockImg = { naturalWidth: 600, naturalHeight: 900 } as unknown as HTMLImageElement;

      await renderScheduleToContext(
        ctx,
        DEFAULT_SCHEDULE_DATA,
        getThemeById('cyber-neon'),
        mockImg,
        {
          avatarConfig: {
            scale: 1.2,
            offsetX: 20,
            offsetY: -10,
            flipHorizontal: true,
            opacity: 0.85,
            alignment: 'right',
          },
        }
      );

      expect(ctx.drawImage).toHaveBeenCalledWith(mockImg, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));
    });
  });

  describe('renderScheduleToCanvas', () => {
    it('throws error if canvas element is missing', async () => {
      await expect(
        renderScheduleToCanvas(null as unknown as HTMLCanvasElement, DEFAULT_SCHEDULE_DATA)
      ).rejects.toThrow('Canvas element is required for rendering');
    });

    it('sets canvas dimensions and draws to context', async () => {
      const mockCtx = createMockContext();
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
      } as unknown as HTMLCanvasElement;

      await renderScheduleToCanvas(mockCanvas, {
        ...DEFAULT_SCHEDULE_DATA,
        resolution: '1920x1080',
      });

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('sets 1200x675 dimensions correctly', async () => {
      const mockCtx = createMockContext();
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
      } as unknown as HTMLCanvasElement;

      await renderScheduleToCanvas(mockCanvas, {
        ...DEFAULT_SCHEDULE_DATA,
        resolution: '1200x675',
      });

      expect(mockCanvas.width).toBe(1200);
      expect(mockCanvas.height).toBe(675);
    });

    it('throws error if getContext returns null', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(null),
      } as unknown as HTMLCanvasElement;

      await expect(
        renderScheduleToCanvas(mockCanvas, DEFAULT_SCHEDULE_DATA)
      ).rejects.toThrow('Failed to obtain CanvasRenderingContext2D');
    });
  });
});
