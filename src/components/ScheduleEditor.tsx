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
} from 'lucide-react';
import { ScheduleItem, StreamCategory, WeeklySchedule } from '../types/schedule';
import { getDayOfWeekJapanese } from '../core/date-utils';

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  onUpdateSchedule: (partial: Partial<WeeklySchedule>) => void;
  onUpdateItem: (index: number, partial: Partial<ScheduleItem>) => void;
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

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  onUpdateSchedule,
  onUpdateItem,
}) => {
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState<boolean>(true);

  return (
    <div className="schedule-editor">
      {/* 基本設定セクション */}
      <section className="editor-card basic-settings-card">
        <button
          type="button"
          className="section-header-btn"
          onClick={() => setIsBasicSettingsOpen((prev) => !prev)}
        >
          <div className="section-title">
            <Settings size={18} className="text-accent" />
            <span>基本情報設定</span>
          </div>
          {isBasicSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isBasicSettingsOpen && (
          <div className="section-body">
            <div className="form-grid-2">
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

      {/* 7日分の配信予定リスト */}
      <section className="daily-schedule-section mt-4">
        <div className="section-subheader">
          <CalendarDays size={18} className="text-accent" />
          <h2>週間配信予定 (7日分)</h2>
        </div>

        <div className="daily-cards-list">
          {schedule.items.map((item, index) => {
            const dayJa = getDayOfWeekJapanese(item.dayOfWeek);
            const isWeekend = item.dayOfWeek === 'SAT' || item.dayOfWeek === 'SUN';

            return (
              <div
                key={item.id || `day-${item.dayOfWeek}`}
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
