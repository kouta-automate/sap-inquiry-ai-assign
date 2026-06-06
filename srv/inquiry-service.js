"use strict";

const cds = require("@sap/cds");
const ai = require("./ai-handler");
const slack = require("./slack-handler");

module.exports = cds.service.impl(async function (srv) {
  const { Inquiries, AssignCandidates, Members } = srv.entities;

  // ── submitInquiry ────────────────────────────────────────────────
  srv.on("submitInquiry", async (req) => {
    const { companyName, contactName, inquiryType, priority,
            desiredResponseDate, subject, content } = req.data;

    // 採番: INQ-YYYYMMDD-連番
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countResult = await SELECT.one`count(*) as cnt`.from(Inquiries)
      .where`inquiryNo like ${"INQ-" + yyyymmdd + "-%"}`;
    const seq = String((countResult?.cnt ?? 0) + 1).padStart(3, "0");
    const inquiryNo = `INQ-${yyyymmdd}-${seq}`;

    // INSERT
    const newInquiry = {
      inquiryNo,
      companyName,
      contactName,
      inquiryType,
      priority,
      desiredResponseDate: desiredResponseDate || null,
      subject,
      content,
      status: "AI分析中"
    };
    const inserted = await INSERT.into(Inquiries).entries(newInquiry);
    const inquiryID = inserted.results?.[0]?.lastID
      ? undefined
      : newInquiry.ID;

    // 採番後の ID を取得
    const saved = await SELECT.one.from(Inquiries)
      .where({ inquiryNo });

    // 非同期 AI パイプライン（レスポンスをブロックしない）
    setImmediate(() => runAiPipeline(saved.ID).catch(console.error));

    return saved;
  });

  // ── approve ──────────────────────────────────────────────────────
  srv.on("approve", async (req) => {
    const { inquiryID, memberID } = req.data;

    await UPDATE(Inquiries, inquiryID).with({
      status: "承認済み",
      assignedMember_ID: memberID,
      assignedAt: new Date().toISOString()
    });

    const [updated, member] = await Promise.all([
      SELECT.one.from(Inquiries).where({ ID: inquiryID }),
      SELECT.one.from(Members).where({ ID: memberID })
    ]);

    setImmediate(() =>
      slack.notifyAssigned(updated, member).catch(err =>
        console.error("[Slack] 通知失敗:", err.message)
      )
    );

    return updated;
  });

  // ── AI パイプライン ───────────────────────────────────────────────
  async function runAiPipeline(inquiryID) {
    const inquiry = await SELECT.one.from(Inquiries).where({ ID: inquiryID });
    if (!inquiry) return;

    // AI① 分析
    const analysis = await ai.analyzeInquiry(inquiry);
    await UPDATE(Inquiries, inquiryID).with({
      aiSummary:        analysis.summary,
      aiAnswer:         analysis.answer,
      aiRequiredSkills: analysis.required_skills.join(","),
      aiMissingInfo:    analysis.missing_info
    });

    // AI② アサイン
    const members = await SELECT.from(Members);
    const candidates = await ai.assignMembers(analysis, members);

    await INSERT.into(AssignCandidates).entries(
      candidates.map(c => ({
        inquiry_ID: inquiryID,
        rank:       c.rank,
        member_ID:  c.member_id,
        reason:     c.reason
      }))
    );

    await UPDATE(Inquiries, inquiryID).with({ status: "承認待ち" });
  }
});
