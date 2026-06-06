# 問い合わせ受付・AI仮アサインシステム

SAP運用保守の問い合わせを受け付け、AIが内容分析・担当者の仮アサインを行い、上長が承認するシステム。

| 項目 | 内容 |
|---|---|
| バックエンド | SAP CAP（Node.js）|
| フロントエンド | SAP UI5 / Fiori Elements |
| AI | SAP Generative AI Hub（gpt-4o）※モックへの切替も可能 |
| DB | SQLite（インメモリ）|
| 通知 | Slack Incoming Webhook（承認時） |
| 実行 | ローカル（`cds watch` / localhost:4004）|

---

## 1. 前提環境

| ツール | バージョン目安 | 用途 |
|--------|--------------|------|
| Node.js | 18 LTS 以上 | CAP実行 |
| npm | Node同梱 | パッケージ管理 |
| @sap/cds-dk | 最新 | CAP CLI（`cds`コマンド） |

---

## 2. 初回セットアップ

```bash
# CAP CLI をグローバルインストール（未導入の場合）
npm install -g @sap/cds-dk

# 依存パッケージのインストール
npm install
```

---

## 3. 起動

```bash
npm run dev
# → http://localhost:4004 で起動
```

| 画面 | URL |
|---|---|
| 問い合わせ入力 | http://localhost:4004/inquiry/index.html |
| 上長承認（一覧・詳細） | http://localhost:4004/approval/index.html |
| OData確認 | http://localhost:4004/ |

---

## 4. Slack通知設定

`.env` に Webhook URL を設定するだけで有効になる。未設定時は通知をスキップ（承認処理には影響しない）。

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXX/XXXX/XXXX
```

**Webhook URLの発行手順**
1. https://api.slack.com/apps でアプリを作成
2. 「Incoming Webhooks」を有効化
3. 「Add New Webhook to Workspace」で通知先チャンネルを選択
4. 発行されたURLを `.env` に貼り付け

---

## 5. AIモード切替

`.env` 1ファイルで切り替わる。アプリ本体の修正は不要。

### パターンB：モック（外部接続なし）

```env
USE_MOCK_AI=true
```

BTPアカウント不要。固定の分析結果を返す。

### パターンA：Generative AI Hub（実AI接続）✅ 実装済み

```env
USE_MOCK_AI=false
AICORE_SERVICE_KEY=<AI CoreサービスキーのJSON（1行）>
AICORE_MODEL_NAME=gpt-4o
```

設定手順は `.env.example` を参照。

---

## 6. ディレクトリ構成

```
/
├── package.json              # 依存関係・scripts
├── .env                      # AIモード設定（gitignore済み）
├── .env.example              # 設定テンプレート
├── db/
│   ├── schema.cds            # データモデル（Inquiries / AssignCandidates / Members）
│   └── data/
│       └── db-Members.csv    # メンバー初期データ（10名）
├── srv/
│   ├── inquiry-service.cds   # OData V4 サービス定義
│   ├── inquiry-service.js    # 採番・承認・AI非同期パイプライン
│   ├── ai-handler.js         # USE_MOCK_AI フラグで振り分け
│   ├── ai-mock.js            # パターンB：モック実装
│   ├── ai-real.js            # パターンA：Generative AI Hub実装 ✅
│   └── slack-handler.js      # Slack Incoming Webhook 通知
└── app/
    ├── inquiry/              # 問い合わせ入力画面（SAP UI5）
    └── approval/             # 上長承認画面（Fiori Elements）
```

---

## 7. 操作フロー

```
① 問い合わせ入力フォームで内容を入力 → 「送信する」
      ↓
② AI①が問い合わせを分析（要約・簡易回答・必要スキル・不足情報）
      ↓
③ AI②がメンバーDBからスキル×負荷で候補3名を選定
      ↓
④ 上長承認画面の一覧に「承認待ち」で表示
      ↓
⑤ 詳細画面でAI分析結果・候補者を確認 → 「承認する」で確定
      ↓
⑥ Slackに通知が送信される（担当者・問い合わせ情報・AI分析結果①）
```

---

## 8. よくあるトラブル

| 症状 | 対処 |
|------|------|
| `cds: command not found` | `npm install -g @sap/cds-dk` を実行 |
| ポート4004が使用中 | 既存プロセスを停止、または `cds watch --port 4005` |
| データが消えた | 仕様（インメモリSQLite）。サーバー再起動で初期データから復元 |
| AI分析が返ってこない | `USE_MOCK_AI=false` 時はAI Core接続を確認。`.env` のキー設定を確認 |
| Slack通知が届かない | `.env` の `SLACK_WEBHOOK_URL` を確認。ターミナルに `[Slack] 通知失敗:` が出ていれば詳細を確認 |

---

## 9. スコープ外

- SAP BTPへのフルデプロイ（MTA / Cloud Foundry）
- HANA Cloud接続
- 認証（XSUAA / IAS）
- 否認フロー・RAG・CI/CD
- Slack以外の通知手段（メール、Teams等）
