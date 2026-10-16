import React, { useState } from 'react';
import { Download, Copy, Share2, Check, Loader2 } from 'lucide-react';
import { WeeklySchedule } from '../types/schedule';
import { generateTweetText, createTwitterIntentUrl } from '../core/export-service';

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

  // ファイル名生成 (例: stream-schedule-20261019.png)
  const getDownloadFileName = (): string => {
    let datePart = 'schedule';
    if (schedule.items.length > 0 && schedule.items[0].dateString) {
      datePart = schedule.items[0].dateString.replace(/[^0-9]/g, '');
    }
    const year = new Date().getFullYear();
    return `stream-schedule-${year}${datePart}.png`;
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

    const tweetText = generateTweetText(schedule);
    const intentUrl = createTwitterIntentUrl(tweetText);

    window.open(intentUrl, '_blank', 'noopener,noreferrer');

    onShowToast(
      'X投稿画面を開きました！画像をクリップボードにコピー済みですので、投稿欄で Ctrl+V して添付してください✨',
      'info'
    );
  };

  return (
    <div className="export-bar">
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
    </div>
  );
};
