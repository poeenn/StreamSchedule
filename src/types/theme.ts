import { StreamCategory } from './schedule';

export type ThemeId =
  | 'cyber-neon'
  | 'pastel-pop'
  | 'simple-modern'
  | 'dark-chic'
  | 'sakura-wa'
  | 'starlight-galaxy'
  | 'cafe-natural'
  | 'pop-comic';

export type FrameStyle =
  | 'cyber'
  | 'ribbon'
  | 'modern'
  | 'luxury'
  | 'wafuu'
  | 'galaxy'
  | 'stitch'
  | 'comic';

export interface ThemeColorPalette {
  background: string;               // 背景単色 または CSSグラデーション起点
  bgGradientEnd?: string;           // 背景グラデーション終点色
  bgGlowColor?: string;             // ネオン・グローエフェクトの色
  cardBg: string;                   // 曜日カード背景色 (半透明含む)
  cardBorder: string;               // カード枠線色
  cardShadow?: string;              // カード影
  textPrimary: string;              // 主テキスト色
  textSecondary: string;            // 副テキスト色 (日付、ラベル)
  accentPrimary: string;            // メインアクセント色 (見出し、ハイライト)
  accentSecondary: string;          // サブアクセント色
  timeBadgeBg: string;              // 時刻バッジ背景色
  timeBadgeText: string;            // 時刻バッジ文字色
  offDayBadgeBg: string;            // お休みバッジ背景色
  offDayBadgeText: string;          // お休みバッジ文字色
  categoryBadgeColors: Record<StreamCategory, { bg: string; text: string }>;
  headerAccent: string;             // ヘッダー飾りバー色
  creditText: string;               // クレジット文字色
}

export type ColorPalette = ThemeColorPalette;

export interface ThemeTypography {
  titleFont: string;                // 大見出しフォントスタック
  dayFont: string;                  // 曜日・日付フォントスタック
  bodyFont: string;                 // 配信タイトルフォントスタック
}

export type FontSettings = ThemeTypography;

export interface ThemeDecoration {
  patternType: 'dots' | 'grid' | 'stripes' | 'none';
  patternOpacity: number;           // 0.05 〜 0.25
  cardCornerRadius: number;         // 角丸半径 (px)
  cardGlow: boolean;                // カード発光エフェクトの有無
  frameStyle?: FrameStyle;          // テンプレート固有の装飾フレーム・モチーフスタイル
}

export type DecorationStyle = ThemeDecoration;

export interface ScheduleTheme {
  id: ThemeId;
  name: string;
  description: string;
  previewThumbnail: string;         // テーマ選択用プレビューメインカラー
  previewGradient?: [string, string]; // ギャラリーサムネイル用背景グラデーション
  badgeLabel?: string;              // ギャラリー表示用ジャンルタグ (例: 'ゲーミング', '和風・桜')
  colors: ThemeColorPalette;
  typography: ThemeTypography;
  decorations: ThemeDecoration;
}

export type ThemeConfig = ScheduleTheme;
