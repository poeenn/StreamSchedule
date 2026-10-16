import React from 'react';
import { Calendar, RefreshCw, RotateCcw, Monitor, Palette } from 'lucide-react';
import { ResolutionPreset, WeeklySchedule } from '../types/schedule';
import { THEMES } from '../themes';

interface HeaderProps {
  schedule: WeeklySchedule;
  onUpdateSchedule: (partial: Partial<WeeklySchedule>) => void;
  onAdvanceWeek: () => void;
  onResetSchedule: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schedule,
  onUpdateSchedule,
  onAdvanceWeek,
  onResetSchedule,
}) => {
  const handleResolutionChange = (res: ResolutionPreset) => {
    onUpdateSchedule({ resolution: res });
  };

  const handleThemeChange = (themeId: string) => {
    onUpdateSchedule({ themeId });
  };

  const handleResetWithConfirm = () => {
    if (window.confirm('入力内容を初期状態にリセットしますか？この操作は取り消せません。')) {
      onResetSchedule();
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand-container">
        <div className="brand-badge">
          <Calendar className="brand-icon" size={24} />
          <div>
            <h1 className="brand-title">配信スケジュールくん</h1>
            <p className="brand-subtitle">StreamSchedule - VTuber・実況者向け週間予定表ジェネレーター</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onAdvanceWeek}
            title="日付を翌週（+7日）へ進めます"
          >
            <RefreshCw size={16} />
            <span>翌週へ繰り越し (+7日)</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm text-muted"
            onClick={handleResetWithConfirm}
            title="スケジュールを初期状態に戻す"
          >
            <RotateCcw size={16} />
            <span>リセット</span>
          </button>
        </div>
      </div>

      <div className="header-controls-bar">
        {/* テーマセレクター */}
        <div className="control-group">
          <label className="control-label">
            <Palette size={16} />
            <span>テーマ</span>
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

        {/* 解像度セレクター */}
        <div className="control-group">
          <label className="control-label">
            <Monitor size={16} />
            <span>出力解像度</span>
          </label>
          <div className="resolution-pills">
            <button
              type="button"
              className={`pill-btn ${schedule.resolution === '1920x1080' ? 'active' : ''}`}
              onClick={() => handleResolutionChange('1920x1080')}
            >
              1920x1080 (フルHD 16:9)
            </button>
            <button
              type="button"
              className={`pill-btn ${schedule.resolution === '1200x675' ? 'active' : ''}`}
              onClick={() => handleResolutionChange('1200x675')}
            >
              1200x675 (Xタイムライン 16:9)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
