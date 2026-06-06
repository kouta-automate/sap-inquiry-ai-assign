# API一覧
## 問い合わせ受付・AI仮アサインシステム（ローカルデモ版）

ベースURL（ローカル）： `http://localhost:4004/odata/v4/InquiryService`
プロトコル： OData V4（CAPが自動生成）

> フロント担当とバック担当の並行作業用の「契約」。このI/Oが守られていれば各自独立して実装できる。

---

## 1. エンティティ（自動生成されるCRUD）

CAPがCDS定義から標準のOData CRUDを自動生成する。主に参照（GET）で使用。

| エンティティ | 主な用途 | 代表エンドポイント |
|-------------|---------|-------------------|
| Inquiries | 問い合わせ一覧・詳細の取得 | `GET /Inquiries`, `GET /Inquiries(<ID>)` |
| AssignCandidates | 仮アサイン候補の取得 | `GET /Inquiries(<ID>)?$expand=candidates` |
| Members | メンバー一覧の取得 | `GET /Members` |

### 承認一覧の取得例
```
GET /Inquiries?$orderby=createdAt desc
  &$select=inquiryNo,subject,inquiryType,priority,createdAt,status
```

### 詳細（AI結果＋候補）の取得例
```
GET /Inquiries(<ID>)?$expand=candidates($expand=member),assignedMember
```

---

## 2. カスタムアクション

### 2-1. submitInquiry — 問い合わせ送信

| 項目 | 内容 |
|------|------|
| メソッド | POST |
| パス | `/submitInquiry` |
| 呼び出し元 | 問い合わせ入力画面 |

**リクエストBody（JSON）**
```json
{
  "companyName": "○○株式会社",
  "contactName": "山田太郎",
  "inquiryType": "障害",
  "priority": "高",
  "desiredResponseDate": "2026-06-10",
  "subject": "FI転記エラーが発生している",
  "content": "XX画面で転記を実行するとエラーになる"
}
```

**レスポンス（JSON）**
```json
{
  "ID": "（採番されたUUID）",
  "inquiryNo": "INQ-20260605-001",
  "status": "AI分析中"
}
```

**サーバー側の動作**
1. inquiryNo を採番
2. Inquiries にINSERT（status=`AI分析中`）
3. レスポンス返却
4. 非同期でAIパイプライン（AI①→AI②）を実行し、完了後 status=`承認待ち` に更新

> 注意：レスポンス時点ではAI結果はまだ入っていない。画面は一覧/詳細を再取得してAI結果を表示する（ポーリング or 再読込）。

---

### 2-2. approve — 承認

| 項目 | 内容 |
|------|------|
| メソッド | POST |
| パス | `/approve` |
| 呼び出し元 | 上長承認詳細画面 |

**リクエストBody（JSON）**
```json
{
  "inquiryID": "（対象問い合わせのUUID）",
  "memberID": "（確定する担当者=1位候補のUUID）"
}
```

**レスポンス（JSON）**
```json
{
  "ID": "（問い合わせUUID）",
  "status": "承認済み",
  "assignedMember_ID": "（担当者UUID）",
  "assignedAt": "2026-06-05T10:30:00Z"
}
```

---

## 3. AI関数のI/O契約（内部・モック↔実接続で共通）

画面からは見えないが、`ai-mock.js` と `ai-real.js` で**必ず同一の形**にすること。これが切替を可能にする鍵。

### analyzeInquiry(inquiry) の戻り値
```json
{
  "summary": "要約（2〜3文）",
  "answer": "簡易回答",
  "required_skills": ["SAP FI", "ABAP"],
  "missing_info": "不足情報"
}
```

### assignMembers(analysis, members) の戻り値
```json
[
  { "rank": 1, "member_id": "<UUID>", "reason": "理由" },
  { "rank": 2, "member_id": "<UUID>", "reason": "理由" },
  { "rank": 3, "member_id": "<UUID>", "reason": "理由" }
]
```

---

## 4. ステータス定義

| ステータス | 意味 | 遷移タイミング |
|-----------|------|--------------|
| AI分析中 | 受付済み、AI処理待ち/処理中 | submitInquiry直後 |
| 承認待ち | AI①②完了、上長確認待ち | AIパイプライン完了後 |
| 承認済み | 担当者確定 | approve実行後 |

---

## 5. 種別・優先度の値

- **inquiryType**： 障害 / 質問 / 要望 / 権限申請 / その他
- **priority**： 高 / 中 / 低
- **Members.status**： 対応可 / 対応中 / 不在
