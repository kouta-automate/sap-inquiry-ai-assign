"use strict";

// パターンA: SAP Generative AI Hub (Orchestration Service) 経由でLLMを呼び出す
// 認証: AICORE_SERVICE_KEY 環境変数 (サービスキーのJSONをそのまま設定)
// モデル: AICORE_MODEL_NAME 環境変数 (デフォルト: gpt-4o)

const { OrchestrationClient } = require("@sap-ai-sdk/orchestration");

const MODEL_NAME = process.env.AICORE_MODEL_NAME || "gpt-4o";

const LLM_CONFIG = {
  promptTemplating: {
    model: {
      name: MODEL_NAME,
      params: { max_tokens: 800, temperature: 0.0 }
    }
  }
};

function parseJson(text) {
  if (!text) throw new Error("LLMから空のレスポンスが返されました");
  const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  return JSON.parse(cleaned);
}

// AI① 問い合わせ内容分析
module.exports.analyzeInquiry = async (inquiry) => {
  const client = new OrchestrationClient(LLM_CONFIG);

  const response = await client.chatCompletion({
    messages: [
      {
        role: "system",
        content: "あなたはSAP運用保守の問い合わせ分析専門家です。指定されたJSON形式のみで回答してください。余分な説明文・マークダウンは一切含めないでください。"
      },
      {
        role: "user",
        content: `以下のSAP問い合わせを分析してください。

問い合わせ種別: ${inquiry.inquiryType || ""}
件名: ${inquiry.subject || ""}
問い合わせ内容: ${inquiry.content || ""}

以下のJSON形式のみで回答してください:
{
  "summary": "問い合わせの要約（100文字以内）",
  "answer": "一般的な対処方法（200文字以内）",
  "required_skills": ["スキル1", "スキル2"],
  "missing_info": "解決に必要な追加情報（100文字以内）"
}`
      }
    ]
  });

  return parseJson(response.getContent());
};

// AI② 担当者アサイン候補選定
module.exports.assignMembers = async (analysis, members) => {
  const activeMembersJson = JSON.stringify(
    members
      .filter(m => m.status !== "不在")
      .map(m => ({
        ID:           m.ID,
        name:         m.name,
        skills:       m.skills,
        domain:       m.domain,
        currentCases: m.currentCases ?? 0
      })),
    null, 2
  );

  const client = new OrchestrationClient(LLM_CONFIG);

  const response = await client.chatCompletion({
    messages: [
      {
        role: "system",
        content: "あなたはSAPコンサルタントのアサイン管理専門家です。指定されたJSON配列形式のみで回答してください。余分な説明文・マークダウンは一切含めないでください。"
      },
      {
        role: "user",
        content: `以下の問い合わせに対して最適な担当者候補を3名選んでください。

必要スキル: ${analysis.required_skills.join("、")}

メンバー一覧:
${activeMembersJson}

選定基準:
1. 必要スキルへの合致度（最優先）
2. 現在の対応件数の少なさ（負荷分散）

以下のJSON配列形式のみで回答してください（member_idはメンバー一覧の実際のID値を使用すること）:
[
  {"rank": 1, "member_id": "実際のUUID", "reason": "選定理由（80文字以内）"},
  {"rank": 2, "member_id": "実際のUUID", "reason": "選定理由（80文字以内）"},
  {"rank": 3, "member_id": "実際のUUID", "reason": "選定理由（80文字以内）"}
]`
      }
    ]
  });

  return parseJson(response.getContent());
};
