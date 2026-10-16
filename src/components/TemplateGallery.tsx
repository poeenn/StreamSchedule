import React, { useRef, useState } from 'react';
import {
  Palette,
  Layout,
  Type,
  Sparkles,
  Upload,
  Trash2,
  Check,
  Sliders,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { THEMES } from '../themes';
import { FontStyleType, LayoutType, WeeklySchedule } from '../types/schedule';
import { ACCENT_COLOR_PRESETS } from '../constants/default-schedule';

interface TemplateGalleryProps {
  schedule: WeeklySchedule;
  onUpdateSchedule: (partial: Partial<WeeklySchedule>) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const LAYOUT_OPTIONS: { id: LayoutType; label: string; desc: string }[] = [
  { id: 'side-avatar', label: '右立ち絵 (標準)', desc: '左:7日カード / 右:立ち絵' },
  { id: 'left-avatar', label: '左立ち絵', desc: '左:立ち絵 / 右:7日カード' },
  { id: 'wide-grid', label: '立ち絵なしワイド', desc: '全画面に7日カードを大きく配置' },
];

const FONT_OPTIONS: { id: FontStyleType; label: string; sample: string }[] = [
  { id: 'theme', label: 'テンプレ標準', sample: 'テーマ最適フォント' },
  { id: 'gothic', label: 'スッキリ角ゴシック', sample: '視認性抜群・ゲーム実況向け' },
  { id: 'rounded', label: 'かわいい丸ゴシック', sample: 'やわらか・雑談＆ポップ向け' },
  { id: 'serif', label: 'クール明朝・セリフ', sample: '和風・大人シック・歌枠向け' },
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  schedule,
  onUpdateSchedule,
  onShowToast,
}) => {
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [isBgDragOver, setIsBgDragOver] = useState(false);

  const handleBgFileLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateSchedule({
          customBgDataUrl: dataUrl,
          bgOverlayOpacity: schedule.bgOverlayOpacity ?? 0.35,
          bgBlur: schedule.bgBlur ?? 0,
        });
        onShowToast('カスタム背景画像を適用しました！', 'success');
      }
    };
    reader.onerror = () => {
      onShowToast('背景画像の読み込みに失敗しました。', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBgFileLoad(file);
    }
  };

  const handleBgDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBgDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleBgFileLoad(file);
    }
  };

  const currentLayout = schedule.layoutType ?? 'side-avatar';
  const currentFont = schedule.fontStyle ?? 'theme';
  const currentCardOpacity = Math.round((schedule.cardOpacity ?? 0.88) * 100);
  const currentBgOverlay = Math.round((schedule.bgOverlayOpacity ?? 0.35) * 100);
  const currentBgBlur = schedule.bgBlur ?? 0;

  return (
    <section className="editor-card template-gallery-card">
      <div className="section-title mb-3">
        <Palette size={18} className="text-accent" />
        <span>1. デザインテンプレート選択（全8種）＆ 背景カスタマイズ</span>
      </div>

      {/* 8種類のビジュアルテンプレートサムネイルギャラリー */}
      <div className="template-gallery-grid" role="radiogroup" aria-label="デザインテンプレート選択">
        {THEMES.map((t) => {
          const isSelected = schedule.themeId === t.id;
          const [gradStart, gradEnd] = t.previewGradient ?? [t.colors.background, t.colors.background];

          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`template-thumb-card ${isSelected ? 'active' : ''}`}
              onClick={() => {
                onUpdateSchedule({ themeId: t.id });
              }}
            >
              {/* ミニチュア16:9グラフィックプレビュー */}
              <div
                className={`template-mini-canvas frame-${t.decorations.frameStyle ?? 'cyber'}`}
                style={{
                  background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
                  borderColor: isSelected ? t.colors.accentPrimary : t.colors.cardBorder,
                }}
              >
                {/* ミニヘッダー帯 */}
                <div className="mini-header-row">
                  <span
                    className="mini-accent-bar"
                    style={{ backgroundColor: t.colors.accentPrimary }}
                  />
                  <span
                    className="mini-title-text"
                    style={{ color: t.colors.accentPrimary }}
                  >
                    SCHEDULE
                  </span>
                  <span
                    className="mini-badge-pill"
                    style={{
                      backgroundColor: t.colors.accentSecondary,
                      color: '#ffffff',
                    }}
                  >
                    7 DAYS
                  </span>
                </div>

                {/* ミニ7日カード＆立ち絵シルエット */}
                <div className="mini-body-split">
                  <div className="mini-cards-grid">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="mini-day-box"
                        style={{
                          backgroundColor: t.colors.cardBg,
                          borderColor:
                            idx === 3 ? t.colors.accentSecondary : t.colors.cardBorder,
                          borderRadius: `${Math.max(2, Math.round(t.decorations.cardCornerRadius / 4))}px`,
                        }}
                      >
                        <span
                          className="mini-day-pill"
                          style={{
                            backgroundColor:
                              idx === 3 ? t.colors.accentSecondary : t.colors.accentPrimary,
                          }}
                        />
                        <span
                          className="mini-day-line"
                          style={{ backgroundColor: t.colors.textPrimary }}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    className="mini-avatar-silhouette"
                    style={{
                      borderColor: t.colors.accentPrimary,
                      background: `radial-gradient(circle, ${t.colors.bgGlowColor ?? 'rgba(255,255,255,0.15)'} 0%, transparent 75%)`,
                    }}
                  />
                </div>

                {isSelected && (
                  <div className="template-selected-badge">
                    <Check size={12} />
                    <span>選択中</span>
                  </div>
                )}
              </div>

              {/* テンプレート名・ジャンル・説明 */}
              <div className="template-card-meta">
                {t.badgeLabel && <span className="template-genre-tag">{t.badgeLabel}</span>}
                <div className="template-name-row">
                  <span
                    className="theme-dot"
                    style={{ backgroundColor: t.previewThumbnail }}
                  />
                  <span className="template-name">{t.name}</span>
                </div>
                <p className="template-desc">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 手持ちのカスタム背景画像（テンプレート背景素材）アップロード欄 */}
      <div className="custom-bg-section mt-4">
        <div className="subsection-header">
          <div className="subsection-title">
            <ImageIcon size={15} className="text-accent" />
            <span>手持ちの背景画像・フリー素材を敷く（任意 / 1920×1080推奨）</span>
          </div>
          {schedule.customBgDataUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-danger"
              onClick={() => {
                onUpdateSchedule({ customBgDataUrl: null });
                onShowToast('カスタム背景画像を解除し、テンプレート標準背景に戻しました。', 'info');
              }}
            >
              <Trash2 size={13} />
              <span>カスタム背景をクリア</span>
            </button>
          )}
        </div>

        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handleBgFileChange}
        />

        {!schedule.customBgDataUrl ? (
          <div
            className={`custom-bg-dropzone ${isBgDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsBgDragOver(true);
            }}
            onDragLeave={() => setIsBgDragOver(false)}
            onDrop={handleBgDrop}
            onClick={() => bgFileInputRef.current?.click()}
          >
            <Upload size={18} className="text-accent" />
            <span>
              BOOTH等の背景素材・配信部屋画像（PNG / JPG / WebP）をクリックまたはドロップして背景に設定
            </span>
          </div>
        ) : (
          <div className="custom-bg-controls">
            <div className="custom-bg-preview-row">
              <img
                src={schedule.customBgDataUrl}
                alt="カスタム背景プレビュー"
                className="custom-bg-thumb"
              />
              <div className="custom-bg-actions">
                <span className="badge badge-success">カスタム背景画像 適用中</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => bgFileInputRef.current?.click()}
                >
                  <Upload size={12} />
                  <span>別の背景画像に変更</span>
                </button>
              </div>
            </div>

            <div className="form-grid-2 mt-3">
              {/* 背景の暗さオーバーレイ */}
              <div className="slider-control">
                <div className="slider-header">
                  <span className="slider-label">背景の暗さ（文字を見やすくする）</span>
                  <span className="slider-value">{currentBgOverlay}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  className="slider-input"
                  aria-label="背景の暗さ"
                  value={schedule.bgOverlayOpacity ?? 0.35}
                  onChange={(e) =>
                    onUpdateSchedule({ bgOverlayOpacity: parseFloat(e.target.value) })
                  }
                />
              </div>

              {/* 背景のぼかし */}
              <div className="slider-control">
                <div className="slider-header">
                  <span className="slider-label">背景のぼかし（立ち絵と予定を際立たせる）</span>
                  <span className="slider-value">{currentBgBlur} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  className="slider-input"
                  aria-label="背景のぼかし"
                  value={currentBgBlur}
                  onChange={(e) =>
                    onUpdateSchedule({ bgBlur: parseInt(e.target.value, 10) })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 構図切替・フォント・推し色・カード透明度カスタマイズ */}
      <div className="design-customizer-grid mt-4">
        {/* レイアウト（構図）切替 */}
        <div className="customizer-block">
          <label className="form-label">
            <Layout size={14} className="text-accent" />
            <span>レイアウト構図（立ち絵位置・顔の向きに合わせる）</span>
          </label>
          <div className="option-buttons-row mt-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`option-card-btn ${currentLayout === opt.id ? 'active' : ''}`}
                onClick={() => onUpdateSchedule({ layoutType: opt.id })}
              >
                <span className="option-main">{opt.label}</span>
                <span className="option-sub">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* フォントスタイル切替 */}
        <div className="customizer-block mt-3">
          <label className="form-label">
            <Type size={14} className="text-accent" />
            <span>フォントスタイル切替</span>
          </label>
          <div className="option-buttons-row mt-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id}
                type="button"
                className={`option-card-btn ${currentFont === font.id ? 'active' : ''}`}
                onClick={() => onUpdateSchedule({ fontStyle: font.id })}
              >
                <span className="option-main">{font.label}</span>
                <span className="option-sub">{font.sample}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 推し色（カスタムアクセントカラー）＆ カードすりガラス透明度 */}
        <div className="form-grid-2 mt-3">
          <div className="customizer-block">
            <div className="slider-header">
              <label className="form-label" htmlFor="customAccentColorPicker">
                <Sparkles size={14} className="text-accent" />
                <span>推し色（カスタムアクセントカラー）</span>
              </label>
              {schedule.customAccentColor && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => onUpdateSchedule({ customAccentColor: '' })}
                  title="テンプレートの標準色に戻す"
                >
                  <RotateCcw size={12} />
                  <span>テーマ標準色に戻す</span>
                </button>
              )}
            </div>

            <div className="accent-color-bar mt-2">
              <input
                id="customAccentColorPicker"
                type="color"
                className="color-picker-input"
                aria-label="推し色カラーピッカー"
                value={schedule.customAccentColor || '#00f3ff'}
                onChange={(e) => onUpdateSchedule({ customAccentColor: e.target.value })}
              />
              <div className="color-swatches">
                {ACCENT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    className={`color-swatch-btn ${
                      schedule.customAccentColor?.toLowerCase() === preset.color.toLowerCase()
                        ? 'active'
                        : ''
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={`推し色: ${preset.label}`}
                    onClick={() => onUpdateSchedule({ customAccentColor: preset.color })}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="customizer-block">
            <div className="slider-header">
              <label className="form-label" htmlFor="cardOpacitySlider">
                <Sliders size={14} className="text-accent" />
                <span>曜日カードの不透明度（すりガラス感調整）</span>
              </label>
              <span className="slider-value">{currentCardOpacity}%</span>
            </div>
            <input
              id="cardOpacitySlider"
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              className="slider-input mt-2"
              value={schedule.cardOpacity ?? 0.88}
              onChange={(e) =>
                onUpdateSchedule({ cardOpacity: parseFloat(e.target.value) })
              }
            />
            <p className="form-help">
              ※下げると背景テンプレートや背景イラストが透けて見えます（30%〜100%）
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
