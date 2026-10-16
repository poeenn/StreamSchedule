import React from 'react';
import {
  Calendar,
  RefreshCw,
  RotateCcw,
  Monitor,
  Palette,
  Save,
  Eraser,
  Layout,
} from 'lucide-react';
import { LayoutType, ResolutionPreset, WeeklySchedule } from '../types/schedule';
import { THEMES } from '../themes';

interface HeaderProps {
  schedule: WeeklySchedule;
  onUpdateSchedule: (partial: Partial<WeeklySchedule>) => void;
  onAdvanceWeek: () => void;
  onClearItemsOnly: () => void;
  onResetSchedule: () => void;
  onSaveNow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schedule,
  onUpdateSchedule,
  onAdvanceWeek,
  onClearItemsOnly,
  onResetSchedule,
  onSaveNow,
}) => {
  const handleResolutionChange = (res: ResolutionPreset) => {
    onUpdateSchedule({ resolution: res });
  };

  const handleLayoutChange = (layoutType: LayoutType) => {
    onUpdateSchedule({ layoutType });
  };

  const handleThemeChange = (themeId: string) => {
    onUpdateSchedule({ themeId });
  };

  const handleClearItemsWithConfirm = () => {
    if (
      window.confirm(
        '配信者名・立ち絵・テンプレート等の「マイ設定」はすべて維持したまま、7日分の予定タイトルのみをクリアしますか？'
      )
    ) {
      onClearItemsOnly();
    }
  };

  const handleResetWithConfirm = () => {
    if (
      window.confirm(
        'すべての設定を初期状態にリセットしますか？この操作は取り消せません。'
      )
    ) {
      onResetSchedule();
    }
  };

  const currentLayout = schedule.layoutType ?? 'side-avatar';

  return (
    <header className="app-header">
      <div className="header-brand-container">
        <div className="brand-badge">
          <Calendar className="brand-icon" size={24} />
          <div>
            <h1 className="brand-title">配信スケジュール画像メーカー</h1>
            <p className="brand-subtitle">
              StreamSchedule - VTuber・実況者向け 週間予定表・告知画像作成ツール
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSaveNow}
            title="現在の全設定（プロフィール・立ち絵・デザイン・予定）をブラウザに保存します"
          >
            <Save size={15} />
            <span>設定を保存</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onAdvanceWeek}
            title="日付を翌週（+7日）へ進めます"
          >
            <RefreshCw size={15} />
            <span>翌週へ繰り越し (+7日)</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClearItemsWithConfirm}
            title="設定や立ち絵は残したまま、7日分の予定枠だけクリアします"
          >
            <Eraser size={15} />
            <span>予定枠のみクリア</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm text-muted"
            onClick={handleResetWithConfirm}
            title="すべての設定を初期状態に戻す"
          >
            <RotateCcw size={15} />
            <span>全初期化</span>
          </button>
        </div>
      </div>

      <div className="header-controls-bar">
        {/* テンプレートクイックセレクター (全8種) */}
        <div className="control-group">
          <label className="control-label">
            <Palette size={16} />
            <span>テンプレート (8種)</span>
          </label>
          <div className="theme-pills">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-pill ${schedule.themeId === t.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(t.id)}
                title={t.description}
              >
                <span
                  className="theme-dot"
                  style={{ backgroundColor: t.previewThumbnail }}
                />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-group-right">
          {/* 構図クイック切替 */}
          <div className="control-group">
            <label className="control-label">
              <Layout size={16} />
              <span>構図</span>
            </label>
            <div className="resolution-pills">
              <button
                type="button"
                className={`pill-btn ${currentLayout === 'side-avatar' ? 'active' : ''}`}
                onClick={() => handleLayoutChange('side-avatar')}
              >
                右立ち絵
              </button>
              <button
                type="button"
                className={`pill-btn ${currentLayout === 'left-avatar' ? 'active' : ''}`}
                onClick={() => handleLayoutChange('left-avatar')}
              >
                左立ち絵
              </button>
              <button
                type="button"
                className={`pill-btn ${currentLayout === 'wide-grid' ? 'active' : ''}`}
                onClick={() => handleLayoutChange('wide-grid')}
              >
                ワイド (立ち絵なし)
              </button>
            </div>
          </div>

          {/* 解像度セレクター */}
          <div className="control-group">
            <label className="control-label">
              <Monitor size={16} />
              <span>解像度</span>
            </label>
            <div className="resolution-pills">
              <button
                type="button"
                className={`pill-btn ${schedule.resolution === '1920x1080' ? 'active' : ''}`}
                onClick={() => handleResolutionChange('1920x1080')}
              >
                1920x1080 (フルHD)
              </button>
              <button
                type="button"
                className={`pill-btn ${schedule.resolution === '1200x675' ? 'active' : ''}`}
                onClick={() => handleResolutionChange('1200x675')}
              >
                1200x675 (X最適)
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
