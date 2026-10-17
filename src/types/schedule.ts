export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type StreamCategory =
  | 'game'      // ゲーム実況
  | 'chat'      // 雑談・晩酌
  | 'sing'      // 歌枠
  | 'collab'    // コラボ配信
  | 'event'     // 記念・イベント枠
  | 'holiday'   // お休み
  | 'other';    // その他

export interface ScheduleItem {
  id: string;               // 一意なID (例: 'item-mon')
  dayOfWeek: DayOfWeek;     // 曜日 (MON 〜 SUN)
  dateString: string;       // 日付文字列 (例: '10/19', '10.19')
  timeString: string;       // 配信時刻 (例: '21:00〜', '20:00 START', '未定')
  title: string;            // 配信タイトル (例: 'Apex Legends 参加型', '雑談配信')
  category: StreamCategory; // カテゴリ
  isOff: boolean;           // 休みフラグ (true の場合「OFF / お休み」としてカード表示)
  badgeText?: string;       // 任意バッジ (例: 'コラボ', '新衣装', '重大発表')
}

export type ResolutionPreset = '1920x1080' | '1200x675';

export type LayoutType = 'side-avatar' | 'left-avatar' | 'wide-grid';

export type FontStyleType =
  | 'theme'          // テンプレ標準（テーマ最適フォント）
  | 'gothic'         // スッキリ角ゴシック (Zen Kaku Gothic New)
  | 'rounded'        // かわいい丸ゴシック (M PLUS Rounded 1c)
  | 'maru-pop'       // ふんわり愛され丸文字 (Kiwi Maru)
  | 'serif'          // クール明朝・セリフ (Shippori Mincho)
  | 'pop-bold'       // 極太インパクトPOP (Dela Gothic One)
  | 'mochiy-pop'     // もちっとポップ (Mochiy Pop One)
  | 'rock-pop'       // ロック＆エネルギッシュ (RocknRoll One)
  | 'pixel-retro'    // レトロゲーム・ドット風 (DotGothic16)
  | 'handwritten'    // 手書き風・マジックペン (Yusei Magic)
  | 'fude-brush'     // 和風毛筆・筆文字 (Yuji Syuku)
  | 'antique-novel'; // クラシカル・ノベル風 (Zen Antique)

export type StreamPlatform =
  | 'YouTube'
  | 'Twitch'
  | 'TwitCasting'
  | 'IRIAM'
  | 'TikTok'
  | '17LIVE'
  | 'ニコニコ';

export interface ResolutionConfig {
  id: ResolutionPreset;
  label: string;            // 表示名 ('フルHD (1920x1080)' / 'Xタイムライン最適化 (1200x675)')
  width: number;
  height: number;
  scaleFactor: number;      // 基準解像度からの比率 (1920基準なら 1.0 と 0.625)
}

export interface CharacterImageConfig {
  imageElement?: HTMLImageElement | null;
  dataUrl?: string | null;  // 復元用Base64/Blob URL
  scale: number;            // 0.5 〜 2.0 (初期値 1.0)
  offsetX: number;          // -600 〜 +600 px (初期値 0)
  offsetY: number;          // -400 〜 +400 px (初期値 0)
  flipHorizontal: boolean;  // 左右反転 (初期値 false)
  opacity: number;          // 0.1 〜 1.0 (初期値 1.0)
  alignment: 'right' | 'left' | 'center'; // 立ち絵基本配置
}

export type AvatarConfig = CharacterImageConfig;

export interface QuickTagPreset {
  id: string;
  label: string;
  title: string;
  category: StreamCategory;
  badgeText?: string;
}

export interface ScheduleData {
  streamerName: string;           // 配信者名 (例: 'ぽえーん / poeenn')
  streamerHandle: string;         // Xアカウント (例: '@poeenn')
  weekTitle: string;              // タイトル (例: 'WEEKLY SCHEDULE', '週間配信予定')
  weekPeriodText: string;         // 期間テキスト (例: '2026.10.19 - 10.25')
  hashtag: string;                // ハッシュタグ (例: '#配信スケジュール #ぽえらいぶ')
  items: ScheduleItem[];          // 7日分の枠情報 (月〜日)
  themeId: string;                // 選択テーマID
  resolution: ResolutionPreset;   // 選択解像度
  showCredit: boolean;            // クレジット透かしの表示 (初期値 true)
  // Phase 4: デザイン＆ジェネレーター拡張設定
  layoutType?: LayoutType;        // 構図 ('side-avatar': 右立ち絵, 'left-avatar': 左立ち絵, 'wide-grid': 立ち絵なしワイド)
  fontStyle?: FontStyleType;      // フォント選択 ('theme' | 'gothic' | 'rounded' | 'serif')
  customAccentColor?: string;     // 推し色（カスタムアクセントカラー HEX）
  cardOpacity?: number;           // カード背景の不透明度 (0.3 〜 1.0)
  platforms?: string[];           // 配信先プラットフォームバッジ (YouTube, Twitch 等)
  fanMark?: string;               // 推しマーク / ファンマーク (例: '🎮🌸')
  customBgDataUrl?: string | null;// カスタム背景画像の DataURL
  bgOverlayOpacity?: number;      // カスタム背景の暗さオーバーレイ (0 〜 0.8)
  bgBlur?: number;                // カスタム背景のぼかし (0 〜 16 px)
}

export type WeeklySchedule = ScheduleData;

export interface SettingsPreset {
  id: string;
  name: string;
  createdAt: string;
  schedule: ScheduleData;
  avatarConfig: Omit<CharacterImageConfig, 'imageElement'>;
}
