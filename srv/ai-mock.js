"use strict";

// 種別ごとに分析結果を変える（デモの説得力向上）
const ANALYSIS_MAP = {
  "障害": {
    summary:         "システム障害が発生しており、業務への影響が懸念される緊急度の高い問い合わせ。",
    answer:          "トランザクションログ（SM21・ST22）でダンプ詳細を確認し、該当テーブルのキー重複や権限不足を調査してください。",
    required_skills: ["SAP FI", "ABAP"],
    missing_info:    "ダンプの完全なスタックトレースと再現手順"
  },
  "質問": {
    summary:         "業務手順または設定方法に関する問い合わせ。",
    answer:          "SAP Help Portal および社内ナレッジベースを参照のうえ、設定手順をご案内ください。",
    required_skills: ["SAP MM"],
    missing_info:    "対象システムのバージョンおよび現在の設定状況"
  },
  "権限申請": {
    summary:         "ユーザーロールまたは権限付与に関する申請。",
    answer:          "SU01/PFCG にてロール確認・付与を行ってください。申請者の所属と必要ロールを確認します。",
    required_skills: ["SAP Security"],
    missing_info:    "申請対象ユーザーIDと付与するロール名の一覧"
  },
  "要望": {
    summary:         "システム改善または機能追加に関する要望。",
    answer:          "要望内容を整理し、影響範囲の調査と工数見積もりを行います。",
    required_skills: ["ABAP", "SAP Fiori"],
    missing_info:    "要望の具体的な仕様および優先度の根拠"
  }
};

const DEFAULT_ANALYSIS = {
  summary:         "問い合わせ内容を受け付けました。詳細を確認し適切な担当者をアサインします。",
  answer:          "内容を精査のうえ、担当者よりご連絡いたします。",
  required_skills: ["SAP BASIS"],
  missing_info:    "詳細な発生状況と再現手順"
};

// AI① 問い合わせ内容分析
module.exports.analyzeInquiry = async (inquiry) => {
  const base = ANALYSIS_MAP[inquiry.inquiryType] ?? DEFAULT_ANALYSIS;
  return {
    summary:         `【${inquiry.inquiryType}】${inquiry.subject}に関する問い合わせ。${base.summary}`,
    answer:          base.answer,
    required_skills: base.required_skills,
    missing_info:    base.missing_info
  };
};

// AI② 担当者アサイン（スキル一致数 → 対応件数の少なさ で上位3名）
module.exports.assignMembers = async (analysis, members) => {
  const skills = analysis.required_skills;

  const scored = members
    .filter(m => m.status !== "不在")
    .map(m => ({
      m,
      hit:  skills.filter(s => (m.skills || "").includes(s)).length,
      load: m.currentCases ?? 0
    }))
    .sort((a, b) => b.hit - a.hit || a.load - b.load)
    .slice(0, 3);

  return scored.map((s, i) => ({
    rank:      i + 1,
    member_id: s.m.ID,
    reason:    `必要スキル${s.hit}件が合致（${skills.join("・")}）、現在対応件数${s.load}件`
  }));
};
