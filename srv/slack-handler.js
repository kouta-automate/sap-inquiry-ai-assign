"use strict";

async function notifyAssigned(inquiry, member) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Slack] SLACK_WEBHOOK_URL が未設定のためスキップ");
    return;
  }

  const message = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "問い合わせアサイン通知", emoji: true }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*担当者*　${member.name}`
        }
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*問い合わせ番号*　${inquiry.inquiryNo}\n*件名*　　　　　${inquiry.subject}`
        }
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*会社名*　　　${inquiry.companyName}`,
            `*担当者名*　　${inquiry.contactName}`,
            `*種別*　　　　${inquiry.inquiryType}　　*優先度*　${inquiry.priority}`,
            `*対応希望日*　${inquiry.desiredResponseDate || "未設定"}`
          ].join("\n")
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*問い合わせ内容*\n>${inquiry.content}`
        }
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            "*AI分析結果①*",
            "",
            `*要約*\n${inquiry.aiSummary || "（未分析）"}`,
            "",
            `*必要スキル*　${inquiry.aiRequiredSkills || "（なし）"}`,
            "",
            `*簡易回答*\n${inquiry.aiAnswer || "（未分析）"}`
          ].join("\n")
        }
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  });

  if (!res.ok) {
    throw new Error(`Slack通知失敗: HTTP ${res.status}`);
  }
}

module.exports = { notifyAssigned };
