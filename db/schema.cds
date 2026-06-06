namespace db;
using { managed, cuid } from '@sap/cds/common';

entity Inquiries : cuid, managed {
  inquiryNo            : String(20);
  companyName          : String(100);
  contactName          : String(100);
  inquiryType          : String(20);
  priority             : String(10);
  desiredResponseDate  : Date;
  subject              : String(200);
  content              : LargeString;
  status               : String(20);
  aiSummary            : LargeString;
  aiAnswer             : LargeString;
  aiRequiredSkills     : String(200);
  aiMissingInfo        : LargeString;
  assignedMember       : Association to Members;
  assignedAt           : Timestamp;
  candidates           : Composition of many AssignCandidates on candidates.inquiry = $self;
}

entity AssignCandidates : cuid {
  inquiry  : Association to Inquiries;
  rank     : Integer;
  member   : Association to Members;
  reason   : LargeString;
}

entity Members : cuid {
  memberNo     : String(10);
  name         : String(100);
  skills       : String(200);
  domain       : String(100);
  currentCases : Integer;
  status       : String(10);
}
