# Prompt Improving Assistant - Chrome Extension

AIプロンプトの品質を向上させるためのChrome拡張機能です。

## 機能

- 📝 **プロンプトキャプチャ**: ChatGPTやClaudeなどのAI画面から入力中のテキストを取得
- ✨ **AI改善提案**: Google Gemini、OpenAI、またはAnthropic Claude APIを使用してプロンプトを分析し、改善ポイントを提示
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
   - **Anthropic Claude**: [Anthropic Console](https://console.anthropic.com/) でAPIキーを取得
3. 使用するプロバイダとモデルを選択
4. 「Save Settings」をクリック

## 使い方

1. ChatGPT (chatgpt.com)、Claude (claude.ai)、または Gemini (gemini.google.com) にアクセス
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
│       ├── llm.js             # LLM API呼び出し
│       └── system-prompt.js   # AIのシステムプロンプト
├── public/
│   └── icons/                 # 拡張機能のアイコン
└── dist/                      # ビルド出力（Chromeに読み込むフォルダ）
```

## 技術スタック

- **フレームワーク**: React (Vite)
- **スタイル**: Vanilla CSS
- **Chrome APIs**: Side Panel API, Storage API, Scripting API
- **AI SDK**: Google Gemini API, OpenAI API, Anthropic Claude API

## 開発

このプロジェクトでは、ビルド時のファイルコピーに [shx](https://github.com/shelljs/shx) を使用しています。
`shx` は `devDependencies` に含まれているため、通常は以下のコマンドだけで開発環境が整います。

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

## 多言語対応

この拡張機能は英語と日本語に対応しており、新しい言語を簡単に追加できます。

### 対応言語

- 🇺🇸 English (英語) - `en`
- 🇯🇵 日本語 (Japanese) - `ja`

### 言語の切り替え

1. 拡張機能のサイドパネルを開く
2. 設定（Settings）画面を開く
3. 「Language」セレクトボックスから言語を選択
4. 選択した言語が即座に反映され、設定が保存されます

### 新しい言語の追加方法

新しい言語を追加する場合は、以下の手順に従ってください。

#### 1. UI翻訳ファイルの作成

`src/locales/` ディレクトリに新しい言語ファイルを作成します。

```bash
# 例: フランス語を追加する場合
cp src/locales/en.json src/locales/fr.json
```

`fr.json` を開き、すべての値を翻訳します（キーは変更しないでください）：

```json
{
  "app_title": "Assistant de Prompt",
  "settings_title": "Paramètres",
  ...
}
```

#### 2. Chrome Web Store メタデータの作成

`_locales/` ディレクトリに新しい言語フォルダとメッセージファイルを作成します。

```bash
# フォルダを作成
mkdir _locales/fr

# メッセージファイルを作成
cp _locales/en/messages.json _locales/fr/messages.json
```

`_locales/fr/messages.json` を開き、拡張機能の名前と説明を翻訳します：

```json
{
  "appName": {
    "message": "Assistant d'Amélioration de Prompt",
    "description": "Nom de l'extension"
  },
  "appDescription": {
    "message": "Assistez l'affinement des prompts IA directement dans le navigateur.",
    "description": "Description de l'extension"
  },
  "actionTitle": {
    "message": "Ouvrir l'Assistant de Prompt",
    "description": "Titre du bouton d'action du navigateur"
  }
}
```

#### 3. 言語設定への追加

`src/locales/index.js` を開き、`SUPPORTED_LANGUAGES` に新しい言語を追加します：

```javascript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語'
  },
  fr: {  // 新規追加
    code: 'fr',
    name: 'French',
    nativeName: 'Français'
  }
};
```

同じファイルの `translations` オブジェクトにもインポートを追加します：

```javascript
import enTranslations from './en.json';
import jaTranslations from './ja.json';
import frTranslations from './fr.json';  // 新規追加

export const translations = {
  en: enTranslations,
  ja: jaTranslations,
  fr: frTranslations  // 新規追加
};
```

#### 4. 翻訳の検証

翻訳チェックスクリプトを実行して、すべてのキーが揃っていることを確認します：

```bash
npm run check-i18n
```

すべてのチェックが通れば成功です：

```
Found languages: en, fr, ja

Checking fr.json against en.json...
  ✅ fr.json is complete and matches en.json

Checking ja.json against en.json...
  ✅ ja.json is complete and matches en.json

============================================================
✅ All translations are complete and consistent!
```

#### 5. ビルドとテスト

```bash
npm run build
```

ビルドした拡張機能を読み込み、設定画面で新しい言語が選択できることを確認してください。

### 翻訳のメンテナンス

新しいUI要素を追加した場合：

1. `src/locales/en.json` に新しいキーと英語の翻訳を追加
2. すべての言語ファイル（`ja.json`, `fr.json` など）に同じキーと翻訳を追加
3. `npm run check-i18n` で漏れがないか確認

## ライセンス

MIT

## 注意事項

- APIキーは `chrome.storage.local` に保存されます
- DOM構造の変更により、ChatGPT/Claudeのアップデート時にキャプチャ機能が動作しなくなる可能性があります
- APIの利用には料金が発生する場合があります
