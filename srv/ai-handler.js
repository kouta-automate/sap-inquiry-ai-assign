"use strict";

const useMock = process.env.USE_MOCK_AI !== "false";
const impl = useMock ? require("./ai-mock") : require("./ai-real");

module.exports.analyzeInquiry = (inquiry)           => impl.analyzeInquiry(inquiry);
module.exports.assignMembers  = (analysis, members) => impl.assignMembers(analysis, members);
