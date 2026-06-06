sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("approval.controller.InquiryList", {

    onItemPress: function (oEvent) {
      const ctx = oEvent.getSource().getBindingContext();
      const id = ctx.getProperty("ID");
      this.getOwnerComponent().getRouter().navTo("detail", { id: encodeURIComponent(id) });
    },

    onSelectionChange: function (oEvent) {
      const item = oEvent.getParameter("listItem");
      const id = item.getBindingContext().getProperty("ID");
      this.getOwnerComponent().getRouter().navTo("detail", { id: encodeURIComponent(id) });
    },

    onRefresh: function () {
      this.byId("inquiryTable").getBinding("items").refresh();
    },

    formatDate: function (val) {
      if (!val) return "";
      return new Date(val).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
  });
});
