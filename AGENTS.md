# プロンプト改善アシスタント (Prompt Improvement Assistant)

## 概要
このプロジェクトは、ブラウザ上で動作するAIプロンプト改善ツールです。ユーザーが入力したプロンプトを、より効果的な形式や内容に改善するためのChrome拡張機能です。

## コンポーネント定義
本プロジェクトは以下の主要なコンポーネントで構成されています。

### 1. Side Panel Agent (UI & Logic)
- **役割**: ユーザーとの対話インターフェースを提供します。プロンプトの入力、改善結果の表示、履歴管理などを行います。
- **主なファイル**:
  - `src/sidepanel/App.jsx`: メインアプリケーションロジック
  - `src/sidepanel/index.html`: エントリーポイント
- **技術スタック**: React, Vite

### 2. Background Agent (Service Worker)
- **役割**: 拡張機能のライフサイクル管理、ブラウザアクション（アイコンクリック）によるサイドパネルの開閉制御を担当します。
- **主なファイル**:
  - `src/background/index.js`: バックグラウンドスクリプト

### 3. Content Script Agent (Page Interactor)
- **役割**: アクティブなWebページからテキスト（プロンプト候補）を取得し、サイドパネルに送信します。ChatGPTなどの特定のチャットUIからの入力取得もサポートします。
- **主なファイル**:
  - `src/content/index.js`: コンテンツスクリプト

## 開発環境
### セットアップ
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

## プロジェクト構成
```
c:/progs/prompt-improving-pub/
├── src/
│   ├── background/     # Service Worker
│   ├── content/        # Content Scripts
│   ├── sidepanel/      # React Application (UI)
│   ├── hooks/          # Custom React Hooks
│   ├── utils/          # Utility Functions
│   └── locales/        # i18n Resources
├── manifest.json       # Chrome Extension Manifest
└── vite.config.js      # Vite Configuration
```

## 重要事項

- **常に、疑問点や提案があれば実装に移る前に質問等を行ってください。**
- ユーザーが回答しやすいよう、質問は番号付き列挙などで番号をつけてください。

### 使用言語

- ユーザーの使用言語は日本語です。チャットなどのユーザーとのやり取りは日本語で行います。
- エージェントの思考プロセス、タスク、プラン等のドキュメントも日本語で表示します。
- コミットコメントやプログラム中のコメントは日本語で書いてください。
