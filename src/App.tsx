import React, { useRef, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ScheduleEditor } from './components/ScheduleEditor';
import { AvatarControls } from './components/AvatarControls';
import { CanvasPreview, CanvasPreviewHandle } from './components/CanvasPreview';
import { ExportBar } from './components/ExportBar';
import { AuthorFooter } from './components/AuthorFooter';
import { useSchedule } from './hooks/useSchedule';
import { useAvatarImage } from './hooks/useAvatarImage';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const App: React.FC = () => {
  const {
    schedule,
    updateSchedule,
    updateItem,
    advanceWeek,
    resetSchedule,
  } = useSchedule();

  const {
    config: avatarConfig,
    isLoading: isAvatarLoading,
    error: avatarError,
    loadFromFile,
    setScale,
    setOffsetX,
    setOffsetY,
    toggleFlipHorizontal,
    setOpacity,
    resetTransform,
    clearAvatar,
  } = useAvatarImage();

  const canvasPreviewRef = useRef<CanvasPreviewHandle>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const getCanvas = useCallback(() => {
    return canvasPreviewRef.current?.getCanvas() ?? null;
  }, []);

  return (
    <div className="app-layout">
      <main className="main-container">
        {/* ヘッダー */}
        <Header
          schedule={schedule}
          onUpdateSchedule={updateSchedule}
          onAdvanceWeek={() => {
            advanceWeek();
            showToast('日付を翌週（+7日）へ更新しました！', 'success');
          }}
          onResetSchedule={() => {
            resetSchedule();
            showToast('初期設定にリセットしました。', 'info');
          }}
        />

        {/* 2カラム構成 (エディタ + プレビュー) */}
        <div className="editor-preview-split">
          {/* 左カラム: 入力フォーム群 */}
          <div className="editor-col">
            <ScheduleEditor
              schedule={schedule}
              onUpdateSchedule={updateSchedule}
              onUpdateItem={updateItem}
            />

            <div className="mt-4">
              <AvatarControls
                avatarConfig={avatarConfig}
                isLoading={isAvatarLoading}
                error={avatarError}
                onLoadFromFile={(file) => {
                  loadFromFile(file);
                  showToast('立ち絵画像を読み込みました！', 'success');
                }}
                onSetScale={setScale}
                onSetOffsetX={setOffsetX}
                onSetOffsetY={setOffsetY}
                onToggleFlipHorizontal={toggleFlipHorizontal}
                onSetOpacity={setOpacity}
                onResetTransform={() => {
                  resetTransform();
                  showToast('立ち絵の位置・サイズをリセットしました。', 'info');
                }}
                onClearAvatar={() => {
                  clearAvatar();
                  showToast('立ち絵を削除しました。', 'info');
                }}
              />
            </div>
          </div>

          {/* 右カラム: リアルタイムCanvasプレビュー & エクスポート */}
          <div className="preview-sticky-col">
            <CanvasPreview
              ref={canvasPreviewRef}
              schedule={schedule}
              avatarConfig={avatarConfig}
            />

            <ExportBar
              getCanvas={getCanvas}
              schedule={schedule}
              onShowToast={showToast}
            />
          </div>
        </div>
      </main>

      {/* フッター (author-profile.md 準拠) */}
      <AuthorFooter />

      {/* トースト通知 */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
