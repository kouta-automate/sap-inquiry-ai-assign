sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("inquiry.controller.SubmitSuccess", {

    onInit: function () {
      const router = this.getOwnerComponent().getRouter();
      router.getRoute("success").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      const no = decodeURIComponent(oEvent.getParameter("arguments").inquiryNo || "");
      if (no) {
        this.byId("inquiryNoTitle").setText("問い合わせID：" + no);
      }
    },

    onNewInquiry: function () {
      this.getOwnerComponent().getRouter().navTo("form");
    }
  });
});
