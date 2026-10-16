import React, { useRef, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { TemplateGallery } from './components/TemplateGallery';
import { SettingsPresetBar } from './components/SettingsPresetBar';
import { ScheduleEditor } from './components/ScheduleEditor';
import { AvatarControls } from './components/AvatarControls';
import { CanvasPreview, CanvasPreviewHandle } from './components/CanvasPreview';
import { ExportBar } from './components/ExportBar';
import { AuthorFooter } from './components/AuthorFooter';
import { useSchedule } from './hooks/useSchedule';
import { useAvatarImage, saveAvatarConfigToStorage } from './hooks/useAvatarImage';
import { useSettingsPresets } from './hooks/useSettingsPresets';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const App: React.FC = () => {
  const {
    schedule,
    setSchedule,
    updateSchedule,
    updateItem,
    applyBulkTime,
    applyStartDate,
    advanceWeek,
    clearItemsOnly,
    resetSchedule,
    saveNow,
  } = useSchedule();

  const {
    config: avatarConfig,
    isLoading: isAvatarLoading,
    error: avatarError,
    loadFromFile,
    restoreAvatarConfig,
    setScale,
    setOffsetX,
    setOffsetY,
    toggleFlipHorizontal,
    setOpacity,
    resetTransform,
    clearAvatar,
  } = useAvatarImage();

  const {
    presets,
    quickTags,
    savePreset,
    overwritePreset,
    deletePreset,
    addQuickTag,
    removeQuickTag,
    setQuickTags,
  } = useSettingsPresets();

  const canvasPreviewRef = useRef<CanvasPreviewHandle>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const getCanvas = useCallback(() => {
    return canvasPreviewRef.current?.getCanvas() ?? null;
  }, []);

  const handleSaveCurrentNow = useCallback(() => {
    const okSchedule = saveNow();
    const okAvatar = saveAvatarConfigToStorage(avatarConfig);
    if (okSchedule && okAvatar) {
      showToast(
        '現在のすべての設定（プロフィール・立ち絵・デザイン・予定）をブラウザに保存しました！',
        'success'
      );
    } else {
      showToast('設定をブラウザに保存しました。', 'info');
    }
  }, [saveNow, avatarConfig, showToast]);

  const handleResetAll = useCallback(() => {
    resetSchedule();
    clearAvatar();
    showToast('すべての設定を初期状態にリセットしました。', 'info');
  }, [resetSchedule, clearAvatar, showToast]);

  const handleClearItemsOnly = useCallback(() => {
    clearItemsOnly();
    showToast(
      '配信者情報・立ち絵・テンプレート設定を維持したまま、7日分の予定枠をクリアしました！',
      'success'
    );
  }, [clearItemsOnly, showToast]);

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
          onClearItemsOnly={handleClearItemsOnly}
          onResetSchedule={handleResetAll}
          onSaveNow={handleSaveCurrentNow}
        />

        {/* マイ設定プリセット管理 & JSONバックアップバー */}
        <div className="mb-4">
          <SettingsPresetBar
            schedule={schedule}
            avatarConfig={avatarConfig}
            presets={presets}
            quickTags={quickTags}
            onSaveCurrentNow={handleSaveCurrentNow}
            onSaveNamedPreset={(name) => savePreset(name, schedule, avatarConfig)}
            onOverwritePreset={(id) => overwritePreset(id, schedule, avatarConfig)}
            onLoadPreset={(preset) => {
              setSchedule(preset.schedule);
              restoreAvatarConfig(preset.avatarConfig);
              showToast(`マイ設定プリセット「${preset.name}」を呼び出しました！`, 'success');
            }}
            onDeletePreset={deletePreset}
            onImportBackup={(importedSchedule, importedAvatar, importedTags) => {
              setSchedule(importedSchedule);
              restoreAvatarConfig(importedAvatar);
              if (importedTags && importedTags.length > 0) {
                setQuickTags(importedTags);
              }
            }}
            onClearItemsOnly={handleClearItemsOnly}
            onResetAll={handleResetAll}
            onShowToast={showToast}
          />
        </div>

        {/* 2カラム構成 (エディタ + プレビュー) */}
        <div className="editor-preview-split">
          {/* 左カラム: テンプレートギャラリー + 入力フォーム + 立ち絵設定 */}
          <div className="editor-col">
            <TemplateGallery
              schedule={schedule}
              onUpdateSchedule={updateSchedule}
              onShowToast={showToast}
            />

            <div className="mt-4">
              <AvatarControls
                avatarConfig={avatarConfig}
                isLoading={isAvatarLoading}
                error={avatarError}
                onLoadFromFile={(file) => {
                  loadFromFile(file);
                  showToast('立ち絵画像を読み込み＆自動保存しました！', 'success');
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

            <div className="mt-4">
              <ScheduleEditor
                schedule={schedule}
                quickTags={quickTags}
                onUpdateSchedule={updateSchedule}
                onUpdateItem={updateItem}
                onApplyBulkTime={applyBulkTime}
                onApplyStartDate={applyStartDate}
                onAddQuickTag={addQuickTag}
                onRemoveQuickTag={removeQuickTag}
                onShowToast={showToast}
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
