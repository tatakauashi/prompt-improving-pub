# Prompt Improving Assistant - Chrome Extension

AIプロンプトの品質を向上させるためのChrome拡張機能です。

## 機能

- 📝 **プロンプトキャプチャ**: ChatGPTやClaudeなどのAI画面から入力中のテキストを取得
- ✨ **AI改善提案**: Google GeminiやOpenAI APIを使用してプロンプトを分析し、改善ポイントを提示
- 🔧 **構造化プロンプト**: より効果的な構造化されたプロンプトを自動生成
- 📋 **編集可能**: 生成された構造化プロンプトは自由に編集可能
- 📎 **クリップボードコピー**: ワンクリックでコピーして元のチャット画面に貼り付け

## インストール

### 1. プロジェクトのビルド

```bash
npm install
npm run build
```

### 2. Chrome拡張機能として読み込む

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. プロジェクトの `dist` フォルダを選択

## 初期設定

1. 拡張機能アイコンをクリックしてサイドパネルを開く
2. 設定画面でAPIキーを入力:
   - **Google Gemini**: [Google AI Studio](https://aistudio.google.com/) でAPIキーを取得
   - **OpenAI**: [OpenAI Platform](https://platform.openai.com/) でAPIキーを取得
3. 使用するプロバイダとモデルを選択
4. 「Save Settings」をクリック

## 使い方

1. ChatGPT (chatgpt.com) または Claude (claude.ai) にアクセス
2. チャット入力欄にプロンプトを入力
3. 拡張機能のサイドパネルを開く
4. **「Capture」** ボタンをクリックして入力テキストを取得
5. **「Improve」** ボタンをクリック
6. AIによる改善提案と構造化されたプロンプトを確認
7. 必要に応じて構造化プロンプトを編集
8. **「Copy to Clipboard」** でコピーして元の画面に貼り付け

## プロジェクト構造

```
prompt-improving/
├── manifest.json              # Chrome拡張機能のマニフェスト
├── src/
│   ├── background/            # バックグラウンドスクリプト
│   │   └── index.js
│   ├── content/               # コンテンツスクリプト（ページ上のDOM操作）
│   │   └── index.js
│   ├── sidepanel/             # サイドパネルUI（React）
│   │   ├── index.html
│   │   ├── App.jsx
│   │   └── App.css
│   └── utils/                 # ユーティリティ（API呼び出し）
│       └── llm.js
├── public/
│   └── icons/                 # 拡張機能のアイコン
└── dist/                      # ビルド出力（Chromeに読み込むフォルダ）
```

## 技術スタック

- **フレームワーク**: React (Vite)
- **スタイル**: Vanilla CSS
- **Chrome APIs**: Side Panel API, Storage API, Scripting API
- **AI SDK**: Google Gemini API, OpenAI API

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### リント

```bash
npm run lint
```

## ライセンス

MIT

## 注意事項

- APIキーは `chrome.storage.local` に保存されます
- DOM構造の変更により、ChatGPT/Claudeのアップデート時にキャプチャ機能が動作しなくなる可能性があります
- APIの利用には料金が発生する場合があります
