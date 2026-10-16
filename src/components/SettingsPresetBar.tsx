import React, { useRef, useState } from 'react';
import {
  Bookmark,
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  Eraser,
  RotateCcw,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AvatarConfig,
  QuickTagPreset,
  SettingsPreset,
  WeeklySchedule,
} from '../types/schedule';
import {
  exportSettingsToJson,
  parseImportedSettingsJson,
} from '../hooks/useSettingsPresets';

interface SettingsPresetBarProps {
  schedule: WeeklySchedule;
  avatarConfig: AvatarConfig;
  presets: SettingsPreset[];
  quickTags: QuickTagPreset[];
  onSaveCurrentNow: () => void;
  onSaveNamedPreset: (name: string) => void;
  onOverwritePreset: (id: string) => void;
  onLoadPreset: (preset: SettingsPreset) => void;
  onDeletePreset: (id: string) => void;
  onImportBackup: (
    schedule: WeeklySchedule,
    avatarConfig: Omit<AvatarConfig, 'imageElement'>,
    quickTags?: QuickTagPreset[]
  ) => void;
  onClearItemsOnly: () => void;
  onResetAll: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const SettingsPresetBar: React.FC<SettingsPresetBarProps> = ({
  schedule,
  avatarConfig,
  presets,
  quickTags,
  onSaveCurrentNow,
  onSaveNamedPreset,
  onOverwritePreset,
  onLoadPreset,
  onDeletePreset,
  onImportBackup,
  onClearItemsOnly,
  onResetAll,
  onShowToast,
}) => {
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const label = presetNameInput.trim() || `${schedule.streamerName || 'マイ'}設定 (${presets.length + 1})`;
    onSaveNamedPreset(label);
    setPresetNameInput('');
    onShowToast(`マイ設定プリセット「${label}」を保存しました！`, 'success');
  };

  // JSON書き出し（バックアップ保存）
  const handleExportJson = () => {
    try {
      const jsonStr = exportSettingsToJson(schedule, avatarConfig, quickTags);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `stream-schedule-settings-${dateStr}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      onShowToast('設定バックアップJSONファイルを保存しました！', 'success');
    } catch (err) {
      console.error('JSON Export error:', err);
      onShowToast('JSONファイルの書き出しに失敗しました。', 'error');
    }
  };

  // JSON読み込み（インポート復元）
  const handleImportJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseImportedSettingsJson(text);
      if (!result.isValid || !result.schedule || !result.avatarConfig) {
        onShowToast(result.error ?? '設定ファイルの読み込みに失敗しました。', 'error');
        return;
      }

      onImportBackup(result.schedule, result.avatarConfig, result.quickTags);
      onShowToast('JSONバックアップから全設定（立ち絵・プロフィール・予定）を復元しました！', 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="editor-card settings-preset-card">
      <div className="preset-bar-top">
        <button
          type="button"
          className="section-header-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div className="section-title">
            <Bookmark size={18} className="text-accent" />
            <span>マイ設定保存・プリセット管理 ＆ JSONバックアップ</span>
            <span className="auto-save-badge">
              <CheckCircle2 size={12} /> 自動保存ON
            </span>
          </div>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="preset-bar-body mt-3">
          {/* クイック保存・バックアップ・スマートリセット操作行 */}
          <div className="preset-quick-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onSaveCurrentNow}
              title="現在のプロフィール・立ち絵・テンプレート・予定をブラウザに即座に保存します"
            >
              <Save size={15} />
              <span>現在の設定を保存</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportJson}
              title="現在の全設定をJSONファイルとしてPC/スマホにバックアップ保存します"
            >
              <Download size={15} />
              <span>設定JSON書き出し</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="保存したJSON設定ファイルを読み込んで復元します"
            >
              <Upload size={15} />
              <span>設定JSON読み込み</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportJsonChange}
            />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (
                  window.confirm(
                    '配信者名・立ち絵・テンプレート等の「マイ設定」はすべて残したまま、7日分の予定タイトルのみを空にしますか？'
                  )
                ) {
                  onClearItemsOnly();
                }
              }}
              title="配信者名・立ち絵・デザイン設定を維持したまま、7日分の予定枠だけクリアします"
            >
              <Eraser size={15} />
              <span>予定枠のみクリア（設定維持）</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm text-danger"
              onClick={() => {
                if (
                  window.confirm(
                    'すべての設定（プロフィール・立ち絵・デザイン・予定）を工場出荷時の初期状態に戻しますか？'
                  )
                ) {
                  onResetAll();
                }
              }}
              title="すべての設定を初期状態に戻します"
            >
              <RotateCcw size={15} />
              <span>全設定を初期化</span>
            </button>
          </div>

          {/* 名前付きマイ設定プリセット登録フォーム */}
          <form className="preset-save-form mt-3" onSubmit={handleCreatePreset}>
            <input
              type="text"
              className="form-input"
              placeholder="プリセット名を入力（例: 通常配信スタイル / 記念イベント週 / サブ垢用）"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              aria-label="マイ設定プリセット名"
            />
            <button type="submit" className="btn btn-secondary btn-sm whitespace-nowrap">
              <Plus size={15} />
              <span>マイプリセットに追加保存</span>
            </button>
          </form>

          {/* 保存済みプリセット一覧 */}
          {presets.length > 0 ? (
            <div className="presets-list mt-3">
              {presets.map((preset) => (
                <div key={preset.id} className="preset-item-row">
                  <div className="preset-item-info">
                    <FolderOpen size={15} className="text-accent" />
                    <span className="preset-item-name">{preset.name}</span>
                    <span className="preset-item-meta">
                      ({preset.schedule.streamerName || '名称未設定'} / {preset.schedule.themeId})
                    </span>
                  </div>
                  <div className="preset-item-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => onLoadPreset(preset)}
                    >
                      <span>呼び出し</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        onOverwritePreset(preset.id);
                        onShowToast(`プリセット「${preset.name}」を現在の設定で上書き保存しました！`, 'success');
                      }}
                    >
                      <span>上書き</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-danger"
                      onClick={() => {
                        onDeletePreset(preset.id);
                        onShowToast(`プリセット「${preset.name}」を削除しました。`, 'info');
                      }}
                      title="プリセットを削除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="form-help mt-2">
              ※ お気に入りの「配信者プロフィール＋立ち絵位置＋テンプレート配色」に名前を付けて複数ストックできます。
            </p>
          )}
        </div>
      )}
    </section>
  );
};
