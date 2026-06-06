sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/ui/core/BusyIndicator"
], function (Controller, MessageBox, BusyIndicator) {
  "use strict";

  return Controller.extend("approval.controller.InquiryDetail", {

    onInit: function () {
      const router = this.getOwnerComponent().getRouter();
      router.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      const id = decodeURIComponent(oEvent.getParameter("arguments").id);
      const page = this.byId("detailPage");
      this._selectedCandidate = null;
      page.bindElement({
        path: "/Inquiries(" + id + ")",
        parameters: {
          $expand: "candidates($expand=member;$orderby=rank),assignedMember"
        }
      });
      this._inquiryID = id;
    },

    onCandidatesLoaded: function () {
      const table = this.byId("candidatesTable");
      const items = table.getItems();
      if (items.length > 0) {
        items[0].setSelected(true);
        this._selectedCandidate = items[0].getBindingContext();
      }
    },

    onCandidateSelect: function (oEvent) {
      const item = oEvent.getParameter("listItem");
      this._selectedCandidate = item ? item.getBindingContext() : null;
    },

    onApprove: function () {
      if (!this._selectedCandidate) {
        MessageBox.warning("承認する担当者を候補一覧から選択してください。");
        return;
      }
      const candidate = this._selectedCandidate.getObject();
      const memberID = candidate.member_ID;
      const memberName = candidate.member?.name || "";

      MessageBox.confirm(`「${memberName}」を担当者として承認しますか？`, {
        title: "承認確認",
        onClose: (action) => {
          if (action !== MessageBox.Action.OK) return;
          this._doApprove(this._inquiryID, memberID);
        }
      });
    },

    _doApprove: function (inquiryID, memberID) {
      BusyIndicator.show(0);

      fetch("/odata/v4/InquiryService/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryID, memberID })
      })
        .then(res => {
          if (!res.ok) return res.json().then(e => Promise.reject(e));
          return res.json();
        })
        .then(() => {
          BusyIndicator.hide();
          this.getOwnerComponent().getModel().refresh();
          MessageBox.success("承認が完了しました。", {
            onClose: () => {
              this.getOwnerComponent().getRouter().navTo("list");
            }
          });
        })
        .catch(err => {
          BusyIndicator.hide();
          MessageBox.error("承認に失敗しました。\n" + (err?.error?.message || JSON.stringify(err)));
        });
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("list");
    },

    formatDateTime: function (val) {
      if (!val) return "";
      return new Date(val).toLocaleString("ja-JP");
    }
  });
});
