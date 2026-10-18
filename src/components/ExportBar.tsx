import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Share2,
  Check,
  Loader2,
  RotateCcw,
  FileText,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { WeeklySchedule } from '../types/schedule';
import {
  generateTweetText,
  createTwitterIntentUrl,
  TWEET_TEMPLATE_OPTIONS,
  TweetTemplateType,
  calculateTweetCharCount,
  calculateTweetWeight,
  MAX_STANDARD_TWEET_WEIGHT,
} from '../core/export-service';

interface ExportBarProps {
  getCanvas: () => HTMLCanvasElement | null;
  schedule: WeeklySchedule;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  getCanvas,
  schedule,
  onShowToast,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [textCopySuccess, setTextCopySuccess] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TweetTemplateType>('vtuber-compact');
  const [customTweetText, setCustomTweetText] = useState<string | null>(null);

  // スケジュールと選択テンプレートから自動生成される投稿文（140文字以内自動調整済み）
  const autoTweetText = useMemo(
    () => generateTweetText(schedule, { template: selectedTemplate }),
    [schedule, selectedTemplate]
  );

  // ユーザーが手動編集していればその内容を優先、未編集なら自動生成文を使用
  const currentTweetText = customTweetText !== null ? customTweetText : autoTweetText;
  const isCustomEdited = customTweetText !== null && customTweetText !== autoTweetText;

  // X (Twitter) 文字数カウント（全角140文字 = 280ウェイト換算）
  const tweetWeight = useMemo(() => calculateTweetWeight(currentTweetText), [currentTweetText]);
  const tweetCharCount = useMemo(
    () => calculateTweetCharCount(currentTweetText),
    [currentTweetText]
  );
  const remainingChars = 140 - tweetCharCount;
  const isOverLimit = tweetWeight > MAX_STANDARD_TWEET_WEIGHT;

  // ファイル名生成 (例: stream-schedule-20261019.png)
  const getDownloadFileName = (): string => {
    let datePart = 'schedule';
    if (schedule.items.length > 0 && schedule.items[0].dateString) {
      datePart = schedule.items[0].dateString.replace(/[^0-9]/g, '');
    }
    const year = new Date().getFullYear();
    return `stream-schedule-${year}${datePart}.png`;
  };

  // テンプレート切り替え
  const handleSelectTemplate = (templateId: TweetTemplateType) => {
    setSelectedTemplate(templateId);
    setCustomTweetText(null);
  };

  // 自動生成文に戻す
  const handleResetTweetText = () => {
    setCustomTweetText(null);
    onShowToast('スケジュールから投稿文を再生成しました！', 'info');
  };

  // 投稿文章のみクリップボードにコピー
  const handleCopyTweetText = async () => {
    if (!navigator.clipboard) {
      onShowToast('クリップボードへのコピーに対応していません。', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(currentTweetText);
      setTextCopySuccess(true);
      setTimeout(() => setTextCopySuccess(false), 2000);
      onShowToast('X投稿用テキストをクリップボードにコピーしました！', 'success');
    } catch {
      onShowToast('テキストのコピーに失敗しました。', 'error');
    }
  };

  // 1. PNGダウンロード
  const handleDownloadPng = async () => {
    const canvas = getCanvas();
    if (!canvas) {
      onShowToast('画像の準備ができていません。少々お待ちください。', 'error');
      return;
    }

    setIsExporting(true);
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          onShowToast('PNG画像の生成に失敗しました。', 'error');
          setIsExporting(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = getDownloadFileName();
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        onShowToast('高解像度PNG画像をダウンロードしました！', 'success');
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Download error:', err);
      onShowToast('ダウンロード中にエラーが発生しました。', 'error');
      setIsExporting(false);
    }
  };

  // 2. クリップボードに画像をコピー
  const handleCopyToClipboard = async () => {
    const canvas = getCanvas();
    if (!canvas) {
      onShowToast('画像の準備ができていません。少々お待ちください。', 'error');
      return;
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      onShowToast(
        'お使いのブラウザはクリップボード画像コピーに対応していません。PNGダウンロードをご利用ください。',
        'info'
      );
      return;
    }

    setIsExporting(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          onShowToast('クリップボード用画像の生成に失敗しました。', 'error');
          setIsExporting(false);
          return;
        }

        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2500);
          onShowToast('画像をクリップボードにコピーしました！(Ctrl+V で直接ペーストできます)', 'success');
        } catch (err) {
          console.error('Clipboard write error:', err);
          onShowToast('クリップボードへのコピーに失敗しました。ダウンロードをご利用ください。', 'error');
        } finally {
          setIsExporting(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Clipboard error:', err);
      onShowToast('クリップボード処理中にエラーが発生しました。', 'error');
      setIsExporting(false);
    }
  };

  // 3. X (Twitter) で告知シェア
  const handleShareToTwitter = async () => {
    const canvas = getCanvas();

    // クリップボードへ自動コピー（可能であれば）
    if (canvas && navigator.clipboard && window.ClipboardItem) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
          } catch {
            // クリップボード失敗してもIntent遷移は継続
          }
        }
      }, 'image/png');
    }

    const intentUrl = createTwitterIntentUrl(currentTweetText);

    window.open(intentUrl, '_blank', 'noopener,noreferrer');

    onShowToast(
      'X投稿画面を開きました！画像をクリップボードにコピー済みですので、投稿欄で Ctrl+V して添付してください✨',
      'info'
    );
  };

  return (
    <div className="export-bar">
      {/* メインエクスポートボタン群 */}
      <div className="export-buttons-group">
        {/* PNGダウンロードボタン */}
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleDownloadPng}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          <span>高解像度PNG保存</span>
        </button>

        {/* クリップボードコピーボタン */}
        <button
          type="button"
          className={`btn btn-lg ${copySuccess ? 'btn-success' : 'btn-secondary'}`}
          onClick={handleCopyToClipboard}
          disabled={isExporting}
        >
          {copySuccess ? <Check size={20} /> : <Copy size={20} />}
          <span>{copySuccess ? 'コピー完了！' : '画像をコピー'}</span>
        </button>

        {/* X共有ボタン */}
        <button
          type="button"
          className="btn btn-x btn-lg"
          onClick={handleShareToTwitter}
          disabled={isExporting}
        >
          <Share2 size={20} />
          <span>X (Twitter) で投稿</span>
        </button>
      </div>

      {/* X (Twitter) 投稿文プレビュー＆テンプレート切替セクション */}
      <div className="tweet-composer-panel mt-3">
        <div className="tweet-composer-header">
          <div className="tweet-composer-title">
            <Sparkles size={15} className="text-accent" />
            <span>X (Twitter) 投稿文テンプレート＆プレビュー</span>
          </div>

          <div
            className={`tweet-char-badge ${
              isOverLimit ? 'is-over' : remainingChars <= 15 ? 'is-near' : 'is-safe'
            }`}
            title="通常Xアカウントの上限（全角140文字＝半角280文字）に対するカウントです"
          >
            {isOverLimit && <AlertTriangle size={13} />}
            <span>
              {tweetCharCount} / 140文字
              {isOverLimit
                ? `（${Math.abs(remainingChars)}文字超過）`
                : `（残り${remainingChars}文字）`}
            </span>
          </div>
        </div>

        {/* 3種類のVTuber投稿文テンプレート切替ピル */}
        <div className="tweet-template-pills" role="tablist" aria-label="X投稿文テンプレート">
          {TWEET_TEMPLATE_OPTIONS.map((opt) => {
            const active = selectedTemplate === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`tweet-template-pill ${active ? 'active' : ''}`}
                onClick={() => handleSelectTemplate(opt.id)}
                title={opt.description}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* 編集可能な投稿文テキストエリア */}
        <textarea
          className={`tweet-preview-textarea ${isOverLimit ? 'border-danger' : ''}`}
          rows={6}
          value={currentTweetText}
          onChange={(e) => setCustomTweetText(e.target.value)}
          aria-label="X投稿文プレビュー・編集"
          placeholder="Xに投稿する告知文をここで自由に編集できます"
        />

        <div className="tweet-composer-footer">
          <span className="tweet-composer-hint">
            ※ 宣伝URL等は入りません。タイトルが長い場合も自動で140文字以内に収まります✨
          </span>

          <div className="tweet-composer-actions">
            {isCustomEdited && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleResetTweetText}
                title="手動編集をリセットしてスケジュールからの自動生成文に戻します"
              >
                <RotateCcw size={13} />
                <span>自動生成文に戻す</span>
              </button>
            )}

            <button
              type="button"
              className={`btn btn-xs ${textCopySuccess ? 'btn-success' : 'btn-secondary'}`}
              onClick={handleCopyTweetText}
            >
              {textCopySuccess ? <Check size={13} /> : <FileText size={13} />}
              <span>{textCopySuccess ? '文章コピー済' : '文章のみコピー'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

