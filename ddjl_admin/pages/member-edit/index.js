import { auth } from "../../services/auth";
import { membersStore } from "../../store/members";

Page({
  data: {
    id: "",
    form: {
      id: "",
      name: "",
      phone: "",
      avatar: "",
      totalLessons: 0,
      lessonPrice: 0,
      note: ""
    }
  },

  onLoad(query) {
    const id = (query && query.id) || "";
    this.setData({ id });
  },

  onShow() {
    if (!auth.requireLogin()) return;
    const m = membersStore.getById(this.data.id);
    if (!m) {
      wx.showToast({ title: "未找到学员", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.setData({
      form: {
        id: m.id,
        name: m.name || "",
        phone: m.phone || "",
        avatar: m.avatar || "",
        totalLessons: m.totalLessons || 0,
        lessonPrice: m.lessonPrice || 0,
        note: m.note || ""
      }
    });
  },

  patch(p) {
    this.setData({ form: { ...this.data.form, ...p } });
  },

  onName(e) {
    this.patch({ name: e.detail.value });
  },
  onPhone(e) {
    this.patch({ phone: e.detail.value });
  },
  onTotalLessons(e) {
    this.patch({ totalLessons: parseInt(e.detail.value, 10) || 0 });
  },
  onLessonPrice(e) {
    this.patch({ lessonPrice: parseInt(e.detail.value, 10) || 0 });
  },
  onNote(e) {
    this.patch({ note: e.detail.value });
  },

  onSave() {
    membersStore.update(this.data.form);
    wx.showToast({ title: "已保存(模拟)", icon: "none" });
    wx.navigateBack();
  },

  goBack() {
    wx.navigateBack();
  }
});
