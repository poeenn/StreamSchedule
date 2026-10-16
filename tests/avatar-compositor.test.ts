import { describe, it, expect, vi } from 'vitest';
import {
  getImageDimensions,
  calculateAvatarTransform,
  drawAvatar,
  drawAvatarDimmerMask,
} from '../src/core/avatar-compositor';
import { CanvasArea } from '../src/types/canvas';

describe('Avatar Compositor', () => {
  const dummyBounds: CanvasArea = {
    x: 1260,
    y: 140,
    width: 600,
    height: 900,
  };

  describe('getImageDimensions', () => {
    it('returns null for null or undefined', () => {
      expect(getImageDimensions(null)).toBeNull();
      expect(getImageDimensions(undefined)).toBeNull();
    });

    it('returns dimensions from HTMLImageElement-like object', () => {
      const img = { naturalWidth: 800, naturalHeight: 1200 } as unknown as HTMLImageElement;
      expect(getImageDimensions(img)).toEqual({ width: 800, height: 1200 });
    });

    it('returns null if naturalWidth or naturalHeight is 0', () => {
      const img = { naturalWidth: 0, naturalHeight: 1200 } as unknown as HTMLImageElement;
      expect(getImageDimensions(img)).toBeNull();
    });

    it('returns dimensions from Canvas/ImageBitmap-like object with width/height', () => {
      const canvasLike = { width: 400, height: 600 } as unknown as CanvasImageSource;
      expect(getImageDimensions(canvasLike)).toEqual({ width: 400, height: 600 });
    });

    it('returns null if width or height is 0', () => {
      const canvasLike = { width: 0, height: 600 } as unknown as CanvasImageSource;
      expect(getImageDimensions(canvasLike)).toBeNull();
    });
  });

  describe('calculateAvatarTransform', () => {
    it('preserves aspect ratio based on bounds width', () => {
      const dimensions = { width: 400, height: 800 }; // 1:2
      const transform = calculateAvatarTransform(dimensions, dummyBounds, {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
      });

      expect(transform.drawWidth).toBe(600);
      expect(transform.drawHeight).toBe(1200);
      expect(transform.centerX).toBe(1260 + 300);
      expect(transform.centerY).toBe(140 + 450);
      expect(transform.scale).toBe(1.0);
      expect(transform.flipHorizontal).toBe(false);
      expect(transform.opacity).toBe(1.0);
    });

    it('applies offset and scale clamping', () => {
      const dimensions = { width: 500, height: 500 };
      const transform = calculateAvatarTransform(dimensions, dummyBounds, {
        scale: 5.0, // clamp to 3.0
        offsetX: 50,
        offsetY: -30,
        flipHorizontal: true,
        opacity: 0.8,
      });

      expect(transform.scale).toBe(3.0);
      expect(transform.centerX).toBe(1260 + 300 + 50);
      expect(transform.centerY).toBe(140 + 450 - 30);
      expect(transform.flipHorizontal).toBe(true);
      expect(transform.opacity).toBe(0.8);
    });
  });

  describe('drawAvatar and drawAvatarDimmerMask', () => {
    function createMockContext() {
      return {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
        fillRect: vi.fn(),
        globalAlpha: 1.0,
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
    }

    it('safely skips rendering and returns false when image is null', () => {
      const ctx = createMockContext();
      const result = drawAvatar(ctx, null, null, dummyBounds);
      expect(result).toBe(false);
      expect(ctx.save).not.toHaveBeenCalled();
      expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    it('safely skips rendering when image has 0 dimension', () => {
      const ctx = createMockContext();
      const img = { naturalWidth: 0, naturalHeight: 0 } as unknown as HTMLImageElement;
      const result = drawAvatar(ctx, img, null, dummyBounds);
      expect(result).toBe(false);
      expect(ctx.drawImage).not.toHaveBeenCalled();
    });

    it('performs transformation and drawImage when valid image is provided', () => {
      const ctx = createMockContext();
      const img = { naturalWidth: 600, naturalHeight: 900 } as unknown as HTMLImageElement;

      const result = drawAvatar(
        ctx,
        img,
        { scale: 1.2, offsetX: 10, offsetY: 20, flipHorizontal: true, opacity: 0.9 },
        dummyBounds
      );

      expect(result).toBe(true);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.globalAlpha).toBe(0.9);
      expect(ctx.translate).toHaveBeenCalledWith(1260 + 300 + 10, 140 + 450 + 20);
      expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
      expect(ctx.scale).toHaveBeenCalledWith(1.2, 1.2);
      expect(ctx.drawImage).toHaveBeenCalledWith(img, -300, -450, 600, 900);
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('draws dimmer mask when enableDimmerMask is true', () => {
      const ctx = createMockContext();
      const img = { naturalWidth: 500, naturalHeight: 500 } as unknown as HTMLImageElement;

      drawAvatar(ctx, img, null, dummyBounds, {
        enableDimmerMask: true,
        dimmerColor: '#070a13',
        dimmerDirection: 'to-left',
      });

      expect(ctx.createLinearGradient).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('supports to-bottom dimmer mask', () => {
      const ctx = createMockContext();
      drawAvatarDimmerMask(ctx, dummyBounds, '#070a13', 'to-bottom');
      expect(ctx.createLinearGradient).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });
});
