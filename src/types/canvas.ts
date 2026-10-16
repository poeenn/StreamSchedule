import { DayOfWeek, ResolutionPreset } from './schedule';

export interface CardRect {
  index: number;
  dayOfWeek: DayOfWeek;
  x: number;
  y: number;
  width: number;
  height: number;
  isWeekend: boolean;
}

export type CardLayout = CardRect;

export interface HeaderLayout {
  titleX: number;
  titleY: number;
  streamerX: number;
  streamerY: number;
  periodX: number;
  periodY: number;
  height: number;
}

export interface AvatarTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  flipHorizontal: boolean;
  opacity: number;
}

export interface CanvasArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CalculatedLayout {
  canvasWidth: number;
  canvasHeight: number;
  header: HeaderLayout;
  cards: CardRect[];
  avatarArea: CanvasArea;
  creditPosition: { x: number; y: number };
}

export type CanvasLayout = CalculatedLayout;

export interface RenderOptions {
  resolution: ResolutionPreset;
  layoutType?: 'side-avatar' | 'wide-grid';
  showCredit?: boolean;
}
