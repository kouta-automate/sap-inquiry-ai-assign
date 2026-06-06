using db from '../db/schema';

@path: '/odata/v4/InquiryService'
service InquiryService {

  entity Inquiries        as projection on db.Inquiries;
  entity AssignCandidates as projection on db.AssignCandidates;
  entity Members          as projection on db.Members;

  // 問い合わせ送信（採番＋保存＋AI起動）
  action submitInquiry(
    companyName         : String,
    contactName         : String,
    inquiryType         : String,
    priority            : String,
    desiredResponseDate : Date,
    subject             : String,
    content             : String
  ) returns Inquiries;

  // 承認（1位候補を確定）
  action approve(
    inquiryID : UUID,
    memberID  : UUID
  ) returns Inquiries;
}
