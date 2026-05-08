import { auth } from "../../services/auth";
import { membersStore } from "../../store/members";
import { todayISO } from "../../utils/date";

Page({
  data: {
    id: "",
    member: null,
    showSheet: false,
    shouldOpenSchedule: false,
    scheduleDate: todayISO(),
    scheduleTime: "10:00",
    scheduleLocation: ""
  },

  onLoad(query) {
    const id = (query && query.id) || "";
    const shouldOpenSchedule = String((query && query.openSchedule) || "") === "1";
    this.setData({ id, shouldOpenSchedule });
  },

  onShow() {
    if (!auth.requireLogin()) return;
    this.refresh();
  },

  refresh() {
    const member = membersStore.getById(this.data.id);
    if (!member) {
      wx.showToast({ title: "未找到学员", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.setData({ member });
    if (this.data.shouldOpenSchedule) {
      this.setData({ shouldOpenSchedule: false, showSheet: true, scheduleLocation: "" });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/member-edit/index?id=${encodeURIComponent(this.data.id)}` });
  },

  onCancel() {
    membersStore.cancelReservation(this.data.id);
    this.refresh();
    wx.showToast({ title: "已取消(模拟)", icon: "none" });
  },

  onComplete() {
    membersStore.completeLesson(this.data.id);
    this.refresh();
    wx.showToast({ title: "已消课(模拟)", icon: "none" });
  },

  openSheet() {
    this.setData({ showSheet: true, scheduleLocation: "" });
  },

  closeSheet() {
    this.setData({ showSheet: false });
  },

  onLocation(e) {
    this.setData({ scheduleLocation: e.detail.value });
  },

  onPickDate(e) {
    this.setData({ scheduleDate: e.detail.value });
  },

  onPickTime(e) {
    this.setData({ scheduleTime: e.detail.value });
  },

  confirmSheet() {
    membersStore.schedule(this.data.id, {
      date: this.data.scheduleDate,
      time: this.data.scheduleTime,
      location: this.data.scheduleLocation
    });
    this.setData({ showSheet: false });
    this.refresh();
    wx.showToast({ title: "已预约(模拟)", icon: "none" });
  }
});
