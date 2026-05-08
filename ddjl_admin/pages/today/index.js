import { auth } from "../../services/auth";
import { membersStore } from "../../store/members";
import { todayISO } from "../../utils/date";

function buildLessons(dateStr) {
  const members = membersStore.list();
  return members
    .filter((m) => m.schedule && String(m.schedule).startsWith(dateStr))
    .sort((a, b) => String(a.schedule).localeCompare(String(b.schedule)))
    .map((m) => ({
      ...m,
      _offsetX: 0,
      _startX: 0,
      _time: (String(m.schedule).split(" ")[1] || "").substring(0, 5)
    }));
}

Page({
  data: {
    statDate: todayISO(),
    todayLessons: []
  },

  onShow() {
    if (!auth.requireLogin()) return;
    this.refresh();
  },

  refresh() {
    this.setData({ todayLessons: buildLessons(this.data.statDate) });
  },

  onTabChange(e) {
    const { url } = e.detail || {};
    if (url) wx.reLaunch({ url });
  },

  onTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    const startX = (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    this.updateLesson(id, { _startX: startX });
  },

  onTouchMove(e) {
    const id = e.currentTarget.dataset.id;
    const x = (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const lesson = this.data.todayLessons.find((l) => l.id === id);
    if (!lesson) return;
    const diff = x - (lesson._startX || 0);
    const isDone = !!lesson.isCompletedToday;
    let offsetX = lesson._offsetX || 0;
    if (diff < 0) offsetX = Math.max(diff, isDone ? -80 : -160);
    if (diff > 0) offsetX = Math.min(diff, 0);
    this.updateLesson(id, { _offsetX: offsetX });
  },

  onTouchEnd(e) {
    const id = e.currentTarget.dataset.id;
    const lesson = this.data.todayLessons.find((l) => l.id === id);
    if (!lesson) return;
    const isDone = !!lesson.isCompletedToday;
    const limit = isDone ? -40 : -80;
    const target = (lesson._offsetX || 0) < limit ? (isDone ? -80 : -160) : 0;
    this.updateLesson(id, { _offsetX: target });
  },

  updateLesson(id, patch) {
    const idx = this.data.todayLessons.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const keyBase = `todayLessons[${idx}]`;
    const obj = {};
    Object.keys(patch).forEach((k) => {
      obj[`${keyBase}.${k}`] = patch[k];
    });
    this.setData(obj);
  },

  onCancel(e) {
    const id = e.currentTarget.dataset.id;
    membersStore.cancelReservation(id);
    this.refresh();
    wx.showToast({ title: "已取消(模拟)", icon: "none" });
  },

  onComplete(e) {
    const id = e.currentTarget.dataset.id;
    membersStore.completeLesson(id);
    this.refresh();
    wx.showToast({ title: "已消课(模拟)", icon: "none" });
  }
});
