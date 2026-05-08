import { auth } from "../../services/auth";

Page({
  onShow() {
    if (!auth.requireLogin()) return;
  },

  goBack() {
    wx.navigateBack();
  }
});
