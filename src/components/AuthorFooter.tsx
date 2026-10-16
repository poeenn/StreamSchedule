import React from 'react';
import { Heart, MessageSquare, ExternalLink, Sparkles, Receipt, Subtitles } from 'lucide-react';
import { APP_LINKS } from '../constants/links';

export const AuthorFooter: React.FC = () => {
  return (
    <footer className="author-footer">
      <div className="footer-container">
        {/* オーサー支援 & フィードバックセクション */}
        <div className="footer-main-grid">
          <div className="footer-col">
            <h3 className="footer-heading">配信スケジュール画像メーカー (StreamSchedule)</h3>
            <p className="footer-desc">
              VTuber・ゲーム実況配信者のためのブラウザ完結型・週間配信予定表＆告知画像作成ツール。
              画像生成やデータ保存はすべてお使いの端末ローカルで処理されるため、未公開情報も安全です。
            </p>
            <div className="author-credits mt-3">
              <span>Created by </span>
              <a
                href={APP_LINKS.X_ACCOUNT}
                target="_blank"
                rel="noopener noreferrer"
                className="author-link"
              >
                {APP_LINKS.AUTHOR_NAME} ({APP_LINKS.X_HANDLE})
                <ExternalLink size={12} className="inline-icon" />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-subheading">開発者サポート & お問い合わせ</h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href={APP_LINKS.DONERU_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link-btn doneru-link"
                >
                  <Heart size={16} className="text-pink" />
                  <span>開発者を応援する (どねる)</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href={APP_LINKS.FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link-btn"
                >
                  <MessageSquare size={16} />
                  <span>ご意見・ご要望・不具合報告</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href={APP_LINKS.X_ACCOUNT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link-btn"
                >
                  <Sparkles size={16} />
                  <span>公式X ({APP_LINKS.X_HANDLE}) をフォロー</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-subheading">おすすめ配信者向けツール</h4>
            <div className="related-tools-list">
              <a
                href={APP_LINKS.STREAM_TRANS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-card"
              >
                <Subtitles size={20} className="tool-icon" />
                <div>
                  <div className="tool-name">
                    StreamTrans (配信字幕くん)
                    <ExternalLink size={12} className="inline-icon" />
                  </div>
                  <div className="tool-desc">Chrome内蔵AI搭載・OBS向けリアルタイム翻訳字幕</div>
                </div>
              </a>

              <a
                href={APP_LINKS.TAX_APP_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-card mt-2"
              >
                <Receipt size={20} className="tool-icon" />
                <div>
                  <div className="tool-name">
                    かんたん経費ノート
                    <ExternalLink size={12} className="inline-icon" />
                  </div>
                  <div className="tool-desc">配信者・クリエイター向け確定申告・経費管理PWA</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright">
            © {new Date().getFullYear()} {APP_LINKS.AUTHOR_NAME}. All rights reserved. 完全クライアントサイド動作 (No server upload)
          </p>
        </div>
      </div>
    </footer>
  );
};
