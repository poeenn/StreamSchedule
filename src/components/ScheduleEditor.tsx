import React, { useState } from 'react';
import {
  User,
  AtSign,
  CalendarDays,
  Hash,
  Clock,
  Tag,
  Coffee,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
  Tv,
  Heart,
  Zap,
  Plus,
  X,
} from 'lucide-react';
import {
  QuickTagPreset,
  ScheduleItem,
  StreamCategory,
  WeeklySchedule,
} from '../types/schedule';
import { STREAM_PLATFORMS } from '../constants/default-schedule';
import { getDayOfWeekJapanese, getWeekMonday, getWeekSunday } from '../core/date-utils';

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  quickTags: QuickTagPreset[];
  onUpdateSchedule: (partial: Partial<WeeklySchedule>) => void;
  onUpdateItem: (index: number, partial: Partial<ScheduleItem>) => void;
  onApplyBulkTime: (timeString: string) => void;
  onApplyStartDate: (startDate: Date) => void;
  onAddQuickTag: (tag: Omit<QuickTagPreset, 'id'>) => void;
  onRemoveQuickTag: (id: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const CATEGORY_OPTIONS: { value: StreamCategory; label: string }[] = [
  { value: 'game', label: '🎮 ゲーム実況' },
  { value: 'chat', label: '💬 雑談・晩酌' },
  { value: 'sing', label: '🎤 歌枠' },
  { value: 'collab', label: '🤝 コラボ配信' },
  { value: 'event', label: '🎉 記念・イベント' },
  { value: 'holiday', label: '☕ お休み' },
  { value: 'other', label: '📌 その他' },
];

const BULK_TIME_PRESETS = ['19:00〜', '20:00〜', '21:00〜', '22:00〜', '23:00〜'];

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  quickTags,
  onUpdateSchedule,
  onUpdateItem,
  onApplyBulkTime,
  onApplyStartDate,
  onAddQuickTag,
  onRemoveQuickTag,
  onShowToast,
}) => {
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState<boolean>(true);
  const [customBulkTime, setCustomBulkTime] = useState<string>('21:00〜');
  const [calendarDateStr, setCalendarDateStr] = useState<string>('');
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  const [newTagLabel, setNewTagLabel] = useState<string>('');
  const [newTagTitle, setNewTagTitle] = useState<string>('');
  const [newTagCategory, setNewTagCategory] = useState<StreamCategory>('game');
  const [newTagBadge, setNewTagBadge] = useState<string>('');

  const selectedPlatforms = schedule.platforms ?? [];

  const handleTogglePlatform = (platform: string) => {
    const exists = selectedPlatforms.includes(platform);
    const next = exists
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    onUpdateSchedule({ platforms: next });
  };

  const handleCreateQuickTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagTitle.trim()) return;
    const label = newTagLabel.trim() || newTagTitle.trim().slice(0, 10);
    onAddQuickTag({
      label,
      title: newTagTitle.trim(),
      category: newTagCategory,
      badgeText: newTagBadge.trim() || undefined,
    });
    setNewTagLabel('');
    setNewTagTitle('');
    setNewTagBadge('');
    setIsAddingTag(false);
    onShowToast?.(`マイ定番枠「${label}」を登録しました！`, 'success');
  };

  return (
    <div className="schedule-editor">
      {/* 基本情報＆プロフィール設定セクション */}
      <section className="editor-card basic-settings-card">
        <button
          type="button"
          className="section-header-btn"
          onClick={() => setIsBasicSettingsOpen((prev) => !prev)}
        >
          <div className="section-title">
            <Settings size={18} className="text-accent" />
            <span>2. 配信者プロフィール・基本情報設定</span>
          </div>
          {isBasicSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isBasicSettingsOpen && (
          <div className="section-body mt-3">
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="streamerName">
                  <User size={14} />
                  <span>配信者名</span>
                </label>
                <input
                  id="streamerName"
                  type="text"
                  className="form-input"
                  placeholder="例: ぽえーん"
                  value={schedule.streamerName}
                  onChange={(e) => onUpdateSchedule({ streamerName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fanMark">
                  <Heart size={14} />
                  <span>推しマーク / ファンマーク</span>
                </label>
                <input
                  id="fanMark"
                  type="text"
                  className="form-input"
                  placeholder="例: 🎮🌸"
                  value={schedule.fanMark ?? ''}
                  onChange={(e) => onUpdateSchedule({ fanMark: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="streamerHandle">
                  <AtSign size={14} />
                  <span>X (Twitter) ID</span>
                </label>
                <input
                  id="streamerHandle"
                  type="text"
                  className="form-input"
                  placeholder="例: @poeenn"
                  value={schedule.streamerHandle}
                  onChange={(e) => onUpdateSchedule({ streamerHandle: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2 mt-3">
              <div className="form-group">
                <label className="form-label" htmlFor="weekTitle">
                  <Sparkles size={14} />
                  <span>メインタイトル</span>
                </label>
                <input
                  id="weekTitle"
                  type="text"
                  className="form-input"
                  placeholder="例: WEEKLY SCHEDULE"
                  value={schedule.weekTitle}
                  onChange={(e) => onUpdateSchedule({ weekTitle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="weekPeriodText">
                  <CalendarDays size={14} />
                  <span>期間テキスト</span>
                </label>
                <input
                  id="weekPeriodText"
                  type="text"
                  className="form-input"
                  placeholder="例: 2026.10.19 - 10.25"
                  value={schedule.weekPeriodText}
                  onChange={(e) => onUpdateSchedule({ weekPeriodText: e.target.value })}
                />
              </div>
            </div>

            {/* 配信プラットフォームバッジ選択 */}
            <div className="form-group mt-3">
              <label className="form-label">
                <Tv size={14} />
                <span>配信先プラットフォームバッジ（複数選択可・ヘッダーに表示）</span>
              </label>
              <div className="platform-pills-row mt-1">
                {STREAM_PLATFORMS.map((platform) => {
                  const active = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      className={`platform-pill ${active ? 'active' : ''}`}
                      onClick={() => handleTogglePlatform(platform)}
                    >
                      <span>{platform}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-grid-2 mt-3">
              <div className="form-group">
                <label className="form-label" htmlFor="hashtag">
                  <Hash size={14} />
                  <span>ハッシュタグ</span>
                </label>
                <input
                  id="hashtag"
                  type="text"
                  className="form-input"
                  placeholder="例: #配信スケジュール #ぽえらいぶ"
                  value={schedule.hashtag}
                  onChange={(e) => onUpdateSchedule({ hashtag: e.target.value })}
                />
              </div>

              <div className="form-group checkbox-group-container">
                <label className="checkbox-label" htmlFor="showCredit">
                  <input
                    id="showCredit"
                    type="checkbox"
                    className="checkbox-input"
                    checked={schedule.showCredit}
                    onChange={(e) => onUpdateSchedule({ showCredit: e.target.checked })}
                  />
                  <span>クレジット透かしを表示 (@poeenn)</span>
                </label>
                <p className="form-help">
                  ※表示していただくと開発者の活動継続支援になります✨
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 時短・一括入力ツールバー */}
      <section className="editor-card quick-tools-card mt-4">
        <div className="section-title mb-2">
          <Zap size={18} className="text-accent" />
          <span>3. 時短ツール（開始日自動計算・一括時刻・マイ定番枠）</span>
        </div>

        {/* ① 開始日・曜日からの7日間自動計算 */}
        <div className="quick-tool-row">
          <span className="quick-tool-label">
            <CalendarDays size={14} /> 開始日から7日分の日付・曜日を自動セット:
          </span>
          <div className="quick-buttons-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => {
                onApplyStartDate(getWeekMonday(new Date()));
                onShowToast?.('今週の月曜始まりで7日分の日付をセットしました！', 'success');
              }}
            >
              今週の月曜から
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => {
                const nextMon = getWeekMonday(new Date());
                nextMon.setDate(nextMon.getDate() + 7);
                onApplyStartDate(nextMon);
                onShowToast?.('来週の月曜始まりで7日分の日付をセットしました！', 'success');
              }}
            >
              来週の月曜から
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => {
                onApplyStartDate(getWeekSunday(new Date()));
                onShowToast?.('今週の日曜始まり（SUN〜SAT）で7日分をセットしました！', 'success');
              }}
            >
              日曜始まりでセット
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => {
                onApplyStartDate(new Date());
                onShowToast?.('今日から7日分の日付・曜日を自動セットしました！', 'success');
              }}
            >
              今日から7日間
            </button>

            <div className="inline-date-picker">
              <input
                type="date"
                className="form-input-xs"
                value={calendarDateStr}
                aria-label="任意の開始日を指定"
                onChange={(e) => {
                  const val = e.target.value;
                  setCalendarDateStr(val);
                  if (val) {
                    const [y, m, d] = val.split('-').map((n) => parseInt(n, 10));
                    if (y && m && d) {
                      onApplyStartDate(new Date(y, m - 1, d));
                      onShowToast?.(`${m}/${d} からの7日間を自動計算してセットしました！`, 'success');
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* ② 一括時刻セット */}
        <div className="quick-tool-row mt-3">
          <span className="quick-tool-label">
            <Clock size={14} /> 全曜日（お休み以外）の配信時刻を一括変更:
          </span>
          <div className="quick-buttons-wrap">
            {BULK_TIME_PRESETS.map((time) => (
              <button
                key={time}
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  onApplyBulkTime(time);
                  onShowToast?.(`お休み以外の全曜日を「${time}」に一括変更しました！`, 'success');
                }}
              >
                {time}
              </button>
            ))}
            <div className="inline-custom-time">
              <input
                type="text"
                className="form-input-xs"
                value={customBulkTime}
                onChange={(e) => setCustomBulkTime(e.target.value)}
                placeholder="任意時刻"
                aria-label="一括適用するカスタム時刻"
              />
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => {
                  if (customBulkTime.trim()) {
                    onApplyBulkTime(customBulkTime.trim());
                    onShowToast?.(
                      `お休み以外の全曜日を「${customBulkTime.trim()}」に一括変更しました！`,
                      'success'
                    );
                  }
                }}
              >
                一括反映
              </button>
            </div>
          </div>
        </div>

        {/* ③ マイ定番枠（クイック入力タグ）管理 */}
        <div className="quick-tool-row mt-3">
          <div className="quick-tag-header-row">
            <span className="quick-tool-label">
              <Tag size={14} /> マイ定番枠（各曜日の「クイック挿入」ボタンに登録されます）:
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-accent"
              onClick={() => setIsAddingTag((prev) => !prev)}
            >
              <Plus size={13} />
              <span>{isAddingTag ? '閉じる' : '定番枠を追加'}</span>
            </button>
          </div>

          <div className="quick-tags-manage-list mt-1">
            {quickTags.map((qt) => (
              <span key={qt.id} className="quick-tag-manage-chip">
                <span>{qt.label}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => onRemoveQuickTag(qt.id)}
                  title={`「${qt.label}」を削除`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          {isAddingTag && (
            <form className="add-quick-tag-form mt-2" onSubmit={handleCreateQuickTag}>
              <input
                type="text"
                className="form-input"
                placeholder="ボタン表示名 (例: 🎤 歌枠)"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                placeholder="自動入力する配信タイトル (必須)"
                value={newTagTitle}
                onChange={(e) => setNewTagTitle(e.target.value)}
                required
              />
              <select
                className="form-select"
                value={newTagCategory}
                onChange={(e) => setNewTagCategory(e.target.value as StreamCategory)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-input"
                placeholder="特別バッジ (任意: 参加型 等)"
                value={newTagBadge}
                onChange={(e) => setNewTagBadge(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-xs whitespace-nowrap">
                登録保存
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 7日分の配信予定リスト */}
      <section className="daily-schedule-section mt-4">
        <div className="section-subheader">
          <CalendarDays size={18} className="text-accent" />
          <h2>4. 週間配信予定 (7日分)</h2>
        </div>

        <div className="daily-cards-list">
          {schedule.items.map((item, index) => {
            const dayJa = getDayOfWeekJapanese(item.dayOfWeek);
            const isWeekend = item.dayOfWeek === 'SAT' || item.dayOfWeek === 'SUN';

            return (
              <div
                key={item.id || `day-${index}`}
                className={`day-card ${isWeekend ? 'is-weekend' : ''} ${item.isOff ? 'is-off' : ''}`}
              >
                {/* 曜日ヘッダー行 */}
                <div className="day-card-header">
                  <div className="day-card-badge">
                    <span className="badge-en">{item.dayOfWeek}</span>
                    <span className="badge-ja">({dayJa})</span>
                  </div>

                  <div className="day-card-date-input">
                    <input
                      type="text"
                      className="form-input-sm"
                      value={item.dateString}
                      onChange={(e) => onUpdateItem(index, { dateString: e.target.value })}
                      placeholder="MM/DD"
                      aria-label={`${item.dayOfWeek} 日付`}
                    />
                  </div>

                  {/* マイ定番枠1クリック挿入ピル */}
                  {!item.isOff && quickTags.length > 0 && (
                    <div className="day-quick-tags-bar">
                      {quickTags.map((qt) => (
                        <button
                          key={qt.id}
                          type="button"
                          className="day-quick-tag-btn"
                          title={`「${qt.title}」をこの曜日にセット`}
                          onClick={() =>
                            onUpdateItem(index, {
                              title: qt.title,
                              category: qt.category,
                              badgeText: qt.badgeText ?? '',
                            })
                          }
                        >
                          {qt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* お休みトグルボタン */}
                  <div className="day-card-off-toggle">
                    <button
                      type="button"
                      className={`btn-toggle-off ${item.isOff ? 'active' : ''}`}
                      onClick={() =>
                        onUpdateItem(index, {
                          isOff: !item.isOff,
                          category: !item.isOff ? 'holiday' : 'game',
                        })
                      }
                      title={item.isOff ? 'お休みを解除する' : 'お休みに設定する'}
                    >
                      <Coffee size={14} />
                      <span>{item.isOff ? 'お休み中' : '休み'}</span>
                    </button>
                  </div>
                </div>

                {/* カードコンテンツ */}
                <div className="day-card-body">
                  {!item.isOff ? (
                    <>
                      {/* 通常配信日フォーム */}
                      <div className="day-form-row">
                        <div className="day-form-time">
                          <label className="form-sublabel">
                            <Clock size={12} />
                            <span>時刻</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={item.timeString}
                            onChange={(e) => onUpdateItem(index, { timeString: e.target.value })}
                            placeholder="21:00〜"
                          />
                        </div>

                        <div className="day-form-category">
                          <label className="form-sublabel">
                            <Tag size={12} />
                            <span>カテゴリ</span>
                          </label>
                          <select
                            className="form-select"
                            value={item.category}
                            onChange={(e) =>
                              onUpdateItem(index, { category: e.target.value as StreamCategory })
                            }
                          >
                            {CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="day-form-badge">
                          <label className="form-sublabel">
                            <Sparkles size={12} />
                            <span>特別バッジ</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={item.badgeText || ''}
                            onChange={(e) => onUpdateItem(index, { badgeText: e.target.value })}
                            placeholder="例: 参加型 / コラボ"
                          />
                        </div>
                      </div>

                      <div className="day-form-title mt-2">
                        <label className="form-sublabel">配信タイトル</label>
                        <input
                          type="text"
                          className="form-input"
                          value={item.title}
                          onChange={(e) => onUpdateItem(index, { title: e.target.value })}
                          placeholder="配信タイトル・企画名を入力"
                        />
                      </div>
                    </>
                  ) : (
                    /* お休み日フォーム */
                    <div className="day-off-container">
                      <div className="day-off-notice">
                        <Coffee size={18} className="text-warning" />
                        <span>この日は「OFF / お休み」として画像に表示されます</span>
                      </div>
                      <div className="day-off-comment mt-2">
                        <label className="form-sublabel">備考・お休み理由（任意）</label>
                        <input
                          type="text"
                          className="form-input"
                          value={item.title}
                          onChange={(e) => onUpdateItem(index, { title: e.target.value })}
                          placeholder="例: 動画編集Day / 喉の休養 / オフ会"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
