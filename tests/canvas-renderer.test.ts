import { describe, it, expect, vi } from 'vitest';
import {
  renderScheduleToContext,
  renderScheduleToCanvas,
  drawRoundedRect,
  wrapText,
  applyAlphaToColor,
  getContrastTextColor,
  resolveEffectiveTheme,
  DAY_OF_WEEK_JA,
  CATEGORY_LABELS,
  FONT_STYLE_OPTIONS,
} from '../src/core/canvas-renderer';
import { DEFAULT_SCHEDULE_DATA } from '../src/constants/default-schedule';
import { THEMES, getThemeById } from '../src/themes';
import { ScheduleData, DayOfWeek, StreamCategory, FontStyleType } from '../src/types/schedule';

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
      setLineDash: vi.fn(),
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
      filter: 'none',
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

    it('applyAlphaToColor converts hex and rgba strings with specified alpha', () => {
      expect(applyAlphaToColor('#00f3ff', 0.5)).toBe('rgba(0, 243, 255, 0.5)');
      expect(applyAlphaToColor('#fff', 0.8)).toBe('rgba(255, 255, 255, 0.8)');
      expect(applyAlphaToColor('rgba(13, 21, 39, 0.85)', 0.4)).toBe('rgba(13, 21, 39, 0.4)');
    });

    it('getContrastTextColor picks dark text for bright colors and light text for dark colors', () => {
      expect(getContrastTextColor('#fde047')).toBe('#0f172a');
      expect(getContrastTextColor('#111827')).toBe('#ffffff');
    });

    it('resolveEffectiveTheme applies fontStyle, customAccentColor, and cardOpacity', () => {
      const base = getThemeById('cyber-neon');
      const customized = resolveEffectiveTheme(base, {
        ...DEFAULT_SCHEDULE_DATA,
        fontStyle: 'serif',
        customAccentColor: '#ff6b9d',
        cardOpacity: 0.5,
      });

      expect(customized.typography.bodyFont).toContain('Shippori Mincho');
      expect(customized.colors.accentPrimary).toBe('#ff6b9d');
      expect(customized.colors.headerAccent).toBe('#ff6b9d');
      expect(customized.colors.timeBadgeBg).toBe('#ff6b9d');
      expect(customized.colors.cardBg).toBe('rgba(13, 21, 39, 0.5)');
    });

    it('defines all 12 FONT_STYLE_OPTIONS and resolveEffectiveTheme correctly maps each font stack', () => {
      expect(FONT_STYLE_OPTIONS).toHaveLength(12);

      const base = getThemeById('cyber-neon');
      const expectedFontMap: Record<FontStyleType, string> = {
        theme: base.typography.bodyFont,
        gothic: "'Zen Kaku Gothic New', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
        rounded: "'M PLUS Rounded 1c', 'Kosugi Maru', sans-serif",
        'maru-pop': "'Kiwi Maru', 'M PLUS Rounded 1c', sans-serif",
        serif: "'Shippori Mincho', 'Noto Serif JP', 'Hiragino Mincho ProN', serif",
        'pop-bold': "'Dela Gothic One', 'Zen Kaku Gothic New', sans-serif",
        'mochiy-pop': "'Mochiy Pop One', 'M PLUS Rounded 1c', sans-serif",
        'rock-pop': "'RocknRoll One', 'Zen Kaku Gothic New', sans-serif",
        'pixel-retro': "'DotGothic16', monospace, sans-serif",
        handwritten: "'Yusei Magic', 'M PLUS Rounded 1c', sans-serif",
        'fude-brush': "'Yuji Syuku', 'Shippori Mincho', serif",
        'antique-novel': "'Zen Antique', 'Shippori Mincho', serif",
      };

      for (const option of FONT_STYLE_OPTIONS) {
        const resolved = resolveEffectiveTheme(base, {
          ...DEFAULT_SCHEDULE_DATA,
          fontStyle: option.id,
        });

        if (option.id === 'theme') {
          expect(resolved.typography.titleFont).toBe(base.typography.titleFont);
          expect(resolved.typography.dayFont).toBe(base.typography.dayFont);
          expect(resolved.typography.bodyFont).toBe(base.typography.bodyFont);
        } else {
          const expectedStack = expectedFontMap[option.id];
          expect(option.fontStack).toBe(expectedStack);
          expect(resolved.typography.titleFont).toBe(expectedStack);
          expect(resolved.typography.dayFont).toBe(expectedStack);
          expect(resolved.typography.bodyFont).toBe(expectedStack);
        }
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
        const lines = wrapText(ctx, 'Short', 100);
        expect(lines).toEqual(['Short']);
      });

      it('wraps long text across multiple lines', () => {
        const ctx = createMockContext();
        const lines = wrapText(ctx, '12345678901234567890', 80, 3);
        expect(lines.length).toBeGreaterThan(1);
        expect(lines.length).toBeLessThanOrEqual(3);
      });

      it('appends ellipsis on final line when exceeding maxLines', () => {
        const ctx = createMockContext();
        const longText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
        const lines = wrapText(ctx, longText, 50, 2);
        expect(lines.length).toBe(2);
        expect(lines[1].endsWith('…')).toBe(true);
      });
    });
  });

  describe('renderScheduleToContext Pipeline (8 Themes & Custom Features)', () => {
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

    it('renders custom background image with blur and overlay when provided', async () => {
      const ctx = createMockContext();
      const mockBgImg = { naturalWidth: 1920, naturalHeight: 1080 } as unknown as HTMLImageElement;

      await renderScheduleToContext(
        ctx,
        {
          ...DEFAULT_SCHEDULE_DATA,
          bgOverlayOpacity: 0.45,
          bgBlur: 6,
        },
        getThemeById('sakura-wa'),
        null,
        {
          customBgImage: mockBgImg,
        }
      );

      expect(ctx.drawImage).toHaveBeenCalledWith(mockBgImg, 0, 0, 1920, 1080);
    });

    it('renders platform badges and fanMark in header', async () => {
      const ctx = createMockContext();
      await renderScheduleToContext(ctx, {
        ...DEFAULT_SCHEDULE_DATA,
        streamerName: 'テスト配信者',
        fanMark: '🌸🎮',
        platforms: ['YouTube', 'Twitch'],
      });

      const fillTextCalls = (ctx.fillText as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      const hasNameWithMark = fillTextCalls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('テスト配信者 🌸🎮')
      );
      const hasTwitch = fillTextCalls.some(
        (call) => typeof call[0] === 'string' && call[0] === 'Twitch'
      );
      expect(hasNameWithMark).toBe(true);
      expect(hasTwitch).toBe(true);
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

    it('synthesizes avatar image in side-avatar and left-avatar modes, and skips in wide-grid', async () => {
      const mockImg = { naturalWidth: 600, naturalHeight: 900 } as unknown as HTMLImageElement;

      const ctxLeft = createMockContext();
      await renderScheduleToContext(
        ctxLeft,
        { ...DEFAULT_SCHEDULE_DATA, layoutType: 'left-avatar' },
        getThemeById('cyber-neon'),
        mockImg
      );
      expect(ctxLeft.drawImage).toHaveBeenCalled();

      const ctxWide = createMockContext();
      await renderScheduleToContext(
        ctxWide,
        { ...DEFAULT_SCHEDULE_DATA, layoutType: 'wide-grid' },
        getThemeById('cyber-neon'),
        mockImg
      );
      expect(ctxWide.drawImage).not.toHaveBeenCalled();
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
