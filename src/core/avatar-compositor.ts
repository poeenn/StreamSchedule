import { CharacterImageConfig } from '../types/schedule';
import { CanvasArea } from '../types/canvas';

export interface DrawAvatarOptions {
  /** 立ち絵の背後または手前に描画するディマーマスクの有無 */
  enableDimmerMask?: boolean;
  /** ディマーグラデーションの基本色 (通常はテーマの背景色) */
  dimmerColor?: string;
  /** ディマーの向き ('to-left' | 'to-right' | 'to-bottom' | 'radial') */
  dimmerDirection?: 'to-left' | 'to-right' | 'to-bottom' | 'radial';
}

/**
 * 画像ソースから安全に寸法 (width, height) を取得する
 */
export function getImageDimensions(
  image: CanvasImageSource | null | undefined
): { width: number; height: number } | null {
  if (!image) return null;

  // HTMLImageElement
  if ('naturalWidth' in image && typeof image.naturalWidth === 'number') {
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return null;
    return { width: image.naturalWidth, height: image.naturalHeight };
  }

  // HTMLVideoElement / HTMLCanvasElement / ImageBitmap / OffscreenCanvas
  if ('width' in image && typeof image.width === 'number') {
    const w = image.width;
    const h = (image as { height: number }).height ?? 0;
    if (w === 0 || h === 0) return null;
    return { width: w, height: h };
  }

  return null;
}

/**
 * 立ち絵の変形・描画サイズおよび中心座標を計算する純粋関数
 */
export function calculateAvatarTransform(
  dimensions: { width: number; height: number },
  bounds: CanvasArea,
  config?: Partial<CharacterImageConfig> | null
) {
  const scale = Math.max(0.1, Math.min(3.0, config?.scale ?? 1.0));
  const offsetX = config?.offsetX ?? 0;
  const offsetY = config?.offsetY ?? 0;
  const flipHorizontal = Boolean(config?.flipHorizontal);
  const opacity = Math.max(0, Math.min(1.0, config?.opacity ?? 1.0));

  const aspectRatio = dimensions.height / dimensions.width;
  // boundsの幅を基準として縦横比を維持
  const drawWidth = bounds.width;
  const drawHeight = drawWidth * aspectRatio;

  const centerX = bounds.x + bounds.width / 2 + offsetX;
  const centerY = bounds.y + bounds.height / 2 + offsetY;

  return {
    scale,
    offsetX,
    offsetY,
    flipHorizontal,
    opacity,
    drawWidth,
    drawHeight,
    centerX,
    centerY,
  };
}

/**
 * スケジュールカードの可読性を確保するためのディマー・グラデーションマスクを描画する
 */
export function drawAvatarDimmerMask(
  ctx: CanvasRenderingContext2D,
  bounds: CanvasArea,
  color: string = 'rgba(7, 10, 19, 0.7)',
  direction: 'to-left' | 'to-right' | 'to-bottom' | 'radial' = 'to-left'
): void {
  ctx.save();

  if (direction === 'to-left') {
    // 立ち絵エリアの右端から左（スケジュール側）に向かって徐々に濃くなるグラデーション
    const gradient = ctx.createLinearGradient(
      bounds.x + bounds.width,
      bounds.y,
      bounds.x,
      bounds.y
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(bounds.x - 80, bounds.y, bounds.width + 80, bounds.height);
  } else if (direction === 'to-right') {
    // 左立ち絵モード用: 立ち絵エリアの左端から右（スケジュール側）に向かって徐々に濃くなるグラデーション
    const gradient = ctx.createLinearGradient(
      bounds.x,
      bounds.y,
      bounds.x + bounds.width,
      bounds.y
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(bounds.x, bounds.y, bounds.width + 80, bounds.height);
  } else if (direction === 'to-bottom') {
    // 立ち絵の足元をフェードアウトさせるグラデーション
    const gradient = ctx.createLinearGradient(
      bounds.x,
      bounds.y + bounds.height * 0.6,
      bounds.x,
      bounds.y + bounds.height
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(bounds.x, bounds.y + bounds.height * 0.6, bounds.width, bounds.height * 0.4);
  }

  ctx.restore();
}

/**
 * 立ち絵画像を Canvas 2D コンテキストに変形合成する
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource | null | undefined,
  config?: Partial<CharacterImageConfig> | null,
  bounds?: CanvasArea,
  options?: DrawAvatarOptions
): boolean {
  if (!image || !bounds) {
    return false;
  }

  const dimensions = getImageDimensions(image);
  if (!dimensions) {
    return false;
  }

  const transform = calculateAvatarTransform(dimensions, bounds, config);

  ctx.save();
  ctx.globalAlpha = transform.opacity;

  // 座標系の中心を立ち絵中心に移動
  ctx.translate(transform.centerX, transform.centerY);

  // 左右反転
  if (transform.flipHorizontal) {
    ctx.scale(-1, 1);
  }

  // スケール
  ctx.scale(transform.scale, transform.scale);

  // 中心原点で描画
  ctx.drawImage(
    image,
    -transform.drawWidth / 2,
    -transform.drawHeight / 2,
    transform.drawWidth,
    transform.drawHeight
  );

  ctx.restore();

  // 可読性確保のディマーマスクが有効な場合
  if (options?.enableDimmerMask) {
    drawAvatarDimmerMask(
      ctx,
      bounds,
      options.dimmerColor ?? 'rgba(7, 10, 19, 0.6)',
      options.dimmerDirection ?? 'to-left'
    );
  }

  return true;
}
