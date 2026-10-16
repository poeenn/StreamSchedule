import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { WeeklySchedule, AvatarConfig } from '../types/schedule';
import { getThemeById } from '../themes';
import { renderScheduleToCanvas } from '../core/canvas-renderer';

export interface CanvasPreviewHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

interface CanvasPreviewProps {
  schedule: WeeklySchedule;
  avatarConfig: AvatarConfig;
  onRenderComplete?: () => void;
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(
  ({ schedule, avatarConfig, onRenderComplete }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(true);
    const renderCountRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      getCanvas: () => internalCanvasRef.current,
    }));

    useEffect(() => {
      let isSubscribed = true;
      const canvas = internalCanvasRef.current;
      if (!canvas) return;

      const currentRenderId = ++renderCountRef.current;
      setIsRendering(true);

      const render = async () => {
        try {
          // フォント待機
          if (typeof document !== 'undefined' && document.fonts?.ready) {
            await document.fonts.ready;
          }

          if (!isSubscribed || currentRenderId !== renderCountRef.current) return;

          const theme = getThemeById(schedule.themeId);
          await renderScheduleToCanvas(
            canvas,
            schedule,
            theme,
            avatarConfig.imageElement ?? null,
            {
              resolution: schedule.resolution,
              showCredit: schedule.showCredit,
              avatarConfig,
            }
          );

          if (isSubscribed && currentRenderId === renderCountRef.current) {
            setIsRendering(false);
            onRenderComplete?.();
          }
        } catch (err) {
          console.error('Canvas render error:', err);
          if (isSubscribed && currentRenderId === renderCountRef.current) {
            setIsRendering(false);
          }
        }
      };

      // 次のアニメーションフレームで描画実行
      const animId = requestAnimationFrame(() => {
        render();
      });

      return () => {
        isSubscribed = false;
        cancelAnimationFrame(animId);
      };
    }, [schedule, avatarConfig, onRenderComplete]);

    const targetWidth = schedule.resolution === '1200x675' ? 1200 : 1920;
    const targetHeight = schedule.resolution === '1200x675' ? 675 : 1080;
    const aspectRatio = `${targetWidth} / ${targetHeight}`;

    return (
      <div className="canvas-preview-wrapper">
        <div
          className="canvas-container"
          style={{
            aspectRatio,
          }}
        >
          <canvas
            ref={internalCanvasRef}
            width={targetWidth}
            height={targetHeight}
            className="preview-canvas"
          />

          {isRendering && (
            <div className="canvas-rendering-overlay">
              <Loader2 className="animate-spin text-accent" size={32} />
              <span className="overlay-text">生成中...</span>
            </div>
          )}
        </div>

        <div className="preview-meta-info">
          <span className="badge badge-outline">
            {schedule.resolution} ({targetWidth} × {targetHeight}px)
          </span>
          <span className="meta-tip">
            ※ クリックやドラッグなしでリアルタイムに更新されます
          </span>
        </div>
      </div>
    );
  }
);

CanvasPreview.displayName = 'CanvasPreview';
