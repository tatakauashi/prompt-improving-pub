## 要件
英語をベースとしながらも、日本語などほかの言語に切り替えられるようにする。
言語切り替えは設定画面で行う。
現在登録されている言語をプルダウンで選択可能にする。

言語の切り替えは、言語ごとのメッセージファイルを用意し、それを切り替えることで実現する。
何か画面項目を追加・修正した場合は、このメッセージファイルにも同様に追加・修正を加える。このとき、すべての言語を対象とすること。
もし切り替えた言語にその文言の翻訳が見つからなかった場合は、英語を表示する。

## 方式

**独自 JSON ロケール＋React Context 方式** で実現する。

**技術手順（ステップ）**

1. Manifest では最低限の `i18n` だけ
    - 拡張機能の名前・説明だけ `_locales` を使う
    - UI本文は `src/locales/` 下の JSON に入れる

2. src/locales/ に言語ごとの JSON を作る
    - src/locales/en.json
    - src/locales/ja.json
    - ...（他の言語）

3. React Context で `t()` 関数を作る
    - 現在の言語 `currentLang`
    - 言語ごとのメッセージ `messages[currentLang]`

4. 言語切り替え UI
    - サイドパネル上でボタンやセレクトボックス
    - 選択を `chrome.storage.local` に保存

5. オフライン対応
    - すべての JSON を bundle に含める（インポートする）
    → ネットなしでも動く

## GitHub Issue URL（人間のための参考に記載。AI はリンク先の確認不要。）
https://github.com/tatakauashi/prompt-improving/issues/4
