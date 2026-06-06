sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/ui/core/BusyIndicator"
], function (Controller, MessageBox, BusyIndicator) {
  "use strict";

  return Controller.extend("inquiry.controller.InquiryForm", {

    onSubmit: function () {
      if (!this._validate()) return;

      const priorityMap = { 0: "高", 1: "中", 2: "低" };
      const priorityGroup = this.byId("priority");
      const priorityVal = priorityMap[priorityGroup.getSelectedIndex()] ?? "中";

      const payload = {
        companyName:         this.byId("companyName").getValue().trim(),
        contactName:         this.byId("contactName").getValue().trim(),
        inquiryType:         this.byId("inquiryType").getSelectedKey(),
        priority:            priorityVal,
        desiredResponseDate: this.byId("desiredResponseDate").getValue() || null,
        subject:             this.byId("subject").getValue().trim(),
        content:             this.byId("content").getValue().trim()
      };

      BusyIndicator.show(0);
      this.byId("submitBtn").setEnabled(false);

      fetch("/odata/v4/InquiryService/submitInquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) return res.json().then(e => Promise.reject(e));
          return res.json();
        })
        .then(data => {
          BusyIndicator.hide();
          const router = this.getOwnerComponent().getRouter();
          router.navTo("success", { inquiryNo: encodeURIComponent(data.inquiryNo || "") });
        })
        .catch(err => {
          BusyIndicator.hide();
          this.byId("submitBtn").setEnabled(true);
          MessageBox.error("送信に失敗しました。\n" + (err?.error?.message || JSON.stringify(err)));
        });
    },

    _validate: function () {
      const required = [
        { id: "companyName",  label: "会社名" },
        { id: "contactName",  label: "担当者名" },
        { id: "subject",      label: "件名" },
        { id: "content",      label: "問い合わせ内容" }
      ];
      let valid = true;

      required.forEach(f => {
        const ctrl = this.byId(f.id);
        if (!ctrl.getValue().trim()) {
          ctrl.setValueState("Error");
          ctrl.setValueStateText(f.label + "は必須です");
          valid = false;
        } else {
          ctrl.setValueState("None");
        }
      });

      const typeCtrl = this.byId("inquiryType");
      if (!typeCtrl.getSelectedKey()) {
        typeCtrl.setValueState("Error");
        valid = false;
      } else {
        typeCtrl.setValueState("None");
      }

      return valid;
    }
  });
});
