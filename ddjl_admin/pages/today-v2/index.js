import { auth } from "../../services/auth";

const WEEK_TEXT = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const DEFAULT_DATE = new Date();
const DEFAULT_DATE_ISO = `${DEFAULT_DATE.getFullYear()}-${String(DEFAULT_DATE.getMonth() + 1).padStart(2, "0")}-${String(
  DEFAULT_DATE.getDate()
).padStart(2, "0")}`;
const DEFAULT_CALENDAR_YEAR = DEFAULT_DATE.getFullYear();
const DEFAULT_CALENDAR_MONTH = DEFAULT_DATE.getMonth() + 1;
const DEFAULT_CANCEL_REASON = "因会员有事取消";
const SWIPE_MAX_OFFSET = -132;
const SWIPE_OPEN_THRESHOLD = -68;
const SWIPE_LOCK_THRESHOLD = 6;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toISO(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function parseISO(iso) {
  const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateLabel(iso) {
  const date = parseISO(iso) || new Date();
  const week = WEEK_TEXT[date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 · ${week}`;
}

function buildCalendarDays(year, month, selectedISO) {
  const firstDayWeek = new Date(year, month - 1, 1).getDay();
  const monthDays = new Date(year, month, 0).getDate();
  const todayISO = toISO(new Date());
  const days = [];

  for (let i = 0; i < firstDayWeek; i += 1) {
    days.push({
      key: `e-${i}`,
      empty: true,
      label: ""
    });
  }

  for (let day = 1; day <= monthDays; day += 1) {
    const iso = `${year}-${pad2(month)}-${pad2(day)}`;
    days.push({
      key: iso,
      iso,
      label: day,
      empty: false,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      key: `x-${days.length}`,
      empty: true,
      label: ""
    });
  }

  return days;
}

function getOffsetMonth(year, month, offset) {
  const date = new Date(year, month - 1 + offset, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1
  };
}

function withSwipeState(list) {
  return (list || []).map((item) => ({
    ...item,
    _offsetX: Number(item && item._offsetX) || 0,
    _startX: Number(item && item._startX) || 0,
    _startY: Number(item && item._startY) || 0,
    _originOffset: Number(item && item._originOffset) || 0,
    _lockDir: String((item && item._lockDir) || "")
  }));
}

Page({
  data: {
    navSafeHeight: 88,
    selectedDateISO: DEFAULT_DATE_ISO,
    calendarTempISO: DEFAULT_DATE_ISO,
    statDate: formatDateLabel(DEFAULT_DATE_ISO),
    showCalendar: false,
    calendarYear: DEFAULT_CALENDAR_YEAR,
    calendarMonth: DEFAULT_CALENDAR_MONTH,
    calendarMonthText: `${DEFAULT_CALENDAR_YEAR}年${DEFAULT_CALENDAR_MONTH}月`,
    calendarDays: buildCalendarDays(DEFAULT_CALENDAR_YEAR, DEFAULT_CALENDAR_MONTH, DEFAULT_DATE_ISO),
    weekDays: ["日", "一", "二", "三", "四", "五", "六"],
    showActionDialog: false,
    actionDialogMode: "",
    actionDialogTitle: "",
    actionDialogContent: "",
    actionTargetId: "",
    actionRemark: "",
    recordScrollEnabled: true,
    studentCount: 8,
    totalHours: "12.5h",
    lessons: withSwipeState([
      {
        id: "l1",
        time: "09:00 - 10:30",
        place: "奥美健身房 · 力量区",
        name: "王小美",
        sub: "第12/24课",
        statusText: "待上课",
        type: "upcoming"
      },
      {
        id: "l2",
        time: "11:00 - 12:00",
        place: "叮叮工作室 · 私教1室",
        name: "李建国",
        sub: "体验课",
        statusText: "上课中",
        type: "inclass"
      },
      {
        id: "l3",
        time: "14:30 - 15:30",
        place: "因会员临时出差取消",
        name: "张思睿",
        sub: "",
        statusText: "已取消",
        type: "cancelled"
      },
      {
        id: "l4",
        time: "16:00 - 17:30",
        place: "奥美健身房 · 操房",
        name: "陈雨欣",
        sub: "第20/20课",
        statusText: "已上课",
        type: "done"
      },
      {
        id: "l5",
        time: "19:00 - 20:30",
        place: "叮叮工作室 · 私教2室",
        name: "赵明远",
        sub: "第5/10课",
        statusText: "已上课",
        type: "done"
      }
    ])
  },

  onLoad() {
    this.initTopSafe();
    this.syncCalendarBySelectedDate();
  },

  onShow() {
    if (!auth.requireLogin()) return;
    this.getTabBar()?.syncSelected();
  },

  initTopSafe() {
    const system = wx.getSystemInfoSync();
    const statusBarHeight = Number(system.statusBarHeight || 20);
    let navSafeHeight = statusBarHeight + 44;

    try {
      if (typeof wx.getMenuButtonBoundingClientRect === "function") {
        const rect = wx.getMenuButtonBoundingClientRect();
        if (rect && rect.bottom) {
          navSafeHeight = Math.max(navSafeHeight, rect.bottom + 10);
        }
      }
    } catch (e) {
      // Ignore; fallback to status bar + title bar height.
    }

    this.setData({ navSafeHeight });
  },

  syncCalendarBySelectedDate() {
    const picked = parseISO(this.data.selectedDateISO) || new Date();
    this.renderCalendar(
      picked.getFullYear(),
      picked.getMonth() + 1,
      this.data.selectedDateISO
    );
  },

  renderCalendar(year, month, selectedISO) {
    this.setData({
      calendarYear: year,
      calendarMonth: month,
      calendarMonthText: `${year}年${month}月`,
      calendarDays: buildCalendarDays(year, month, selectedISO)
    });
  },

  onSwitchDate() {
    const baseISO = this.data.selectedDateISO || toISO(new Date()) || DEFAULT_DATE_ISO;
    const baseDate = parseISO(baseISO) || new Date();
    this.setData({
      showCalendar: true,
      calendarTempISO: baseISO
    });
    this.renderCalendar(baseDate.getFullYear(), baseDate.getMonth() + 1, baseISO);
  },

  onCalendarMaskTap() {
    this.onCalendarCancel();
  },

  onCalendarPanelTap() {},

  onCalendarCancel() {
    this.setData({
      showCalendar: false,
      calendarTempISO: this.data.selectedDateISO
    });
  },

  onCalendarConfirm() {
    const selectedDateISO = this.data.calendarTempISO || this.data.selectedDateISO || DEFAULT_DATE_ISO;
    this.setData({
      selectedDateISO,
      statDate: formatDateLabel(selectedDateISO),
      showCalendar: false
    });
  },

  onCalendarPrevMonth() {
    const { year, month } = getOffsetMonth(this.data.calendarYear, this.data.calendarMonth, -1);
    this.renderCalendar(year, month, this.data.calendarTempISO);
  },

  onCalendarNextMonth() {
    const { year, month } = getOffsetMonth(this.data.calendarYear, this.data.calendarMonth, 1);
    this.renderCalendar(year, month, this.data.calendarTempISO);
  },

  onPickCalendarDay(e) {
    const iso = e.currentTarget.dataset.iso;
    if (!iso) return;
    const date = parseISO(iso);
    if (!date) return;
    this.setData({ calendarTempISO: iso });
    this.renderCalendar(date.getFullYear(), date.getMonth() + 1, iso);
  },

  onTrackMoreTap() {
    if (!this.data.lessons || this.data.lessons.length === 0) {
      wx.showToast({ title: "当前没有课程记录", icon: "none" });
      return;
    }

    wx.showModal({
      title: "一键清课",
      content: "确认将未取消课程全部标记为已上课吗？",
      cancelText: "取消",
      confirmText: "确认",
      confirmColor: "#b81d65",
      success: (res) => {
        if (!res.confirm) return;
        let changedCount = 0;
        const lessons = (this.data.lessons || []).map((item) => {
          if (!item || item.type === "cancelled" || item.type === "done") return item;
          changedCount += 1;
          return {
            ...item,
            type: "done",
            statusText: "已上课",
            _offsetX: 0,
            _startX: 0
          };
        });

        this.setData({ lessons });
        if (changedCount === 0) {
          wx.showToast({ title: "已无可更新课程", icon: "none" });
          return;
        }
        wx.showToast({ title: `已更新${changedCount}节课程`, icon: "none" });
      }
    });
  },

  closeAllSwipes(exceptId = "") {
    const lessons = (this.data.lessons || []).map((item) => {
      if (!item || item.id === exceptId) return item;
      if (!item._offsetX) return item;
      return {
        ...item,
        _offsetX: 0,
        _startX: 0,
        _startY: 0,
        _originOffset: 0,
        _lockDir: ""
      };
    });
    this.setData({ lessons });
  },

  updateLessonById(id, patch) {
    const lessons = [...(this.data.lessons || [])];
    const idx = lessons.findIndex((item) => item && item.id === id);
    if (idx < 0) return null;
    lessons[idx] = { ...lessons[idx], ...patch };
    this.setData({ lessons });
    return lessons[idx];
  },

  onLessonTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const startX = (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const startY = (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
    const lesson = (this.data.lessons || []).find((item) => item && item.id === id);
    const originOffset = lesson ? Number(lesson._offsetX || 0) : 0;
    this.closeAllSwipes(id);
    this.updateLessonById(id, {
      _startX: startX,
      _startY: startY,
      _originOffset: originOffset,
      _lockDir: ""
    });
  },

  onLessonTouchMove(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const x = (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const y = (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
    const lesson = (this.data.lessons || []).find((item) => item && item.id === id);
    if (!lesson) return;
    const diffX = x - (lesson._startX || 0);
    const diffY = y - (lesson._startY || 0);

    let lockDir = lesson._lockDir || "";
    if (!lockDir) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      if (absX < SWIPE_LOCK_THRESHOLD && absY < SWIPE_LOCK_THRESHOLD) return;
      if (absX > absY + 2) {
        lockDir = "x";
        this.updateLessonById(id, { _lockDir: "x" });
        if (this.data.recordScrollEnabled) this.setData({ recordScrollEnabled: false });
      } else {
        lockDir = "y";
        this.updateLessonById(id, { _lockDir: "y" });
        if (!this.data.recordScrollEnabled) this.setData({ recordScrollEnabled: true });
        return;
      }
    }

    if (lockDir === "y") return;

    const originOffset = Number(lesson._originOffset || 0);
    let offsetX = originOffset + diffX;
    if (offsetX < SWIPE_MAX_OFFSET) offsetX = SWIPE_MAX_OFFSET;
    if (offsetX > 0) offsetX = 0;
    this.updateLessonById(id, { _offsetX: offsetX });
  },

  onLessonTouchEnd(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const lesson = (this.data.lessons || []).find((item) => item && item.id === id);
    if (!lesson) return;
    const current = lesson._offsetX || 0;
    const lockDir = lesson._lockDir || "";
    const target = lockDir === "x" && current <= SWIPE_OPEN_THRESHOLD ? SWIPE_MAX_OFFSET : 0;
    this.updateLessonById(id, {
      _offsetX: lockDir === "x" ? target : current,
      _startX: 0,
      _startY: 0,
      _originOffset: 0,
      _lockDir: ""
    });
    if (!this.data.recordScrollEnabled) this.setData({ recordScrollEnabled: true });
  },

  onLessonTouchCancel(e) {
    this.onLessonTouchEnd(e);
  },

  openActionDialog(mode, id) {
    const lesson = (this.data.lessons || []).find((item) => item && item.id === id);
    if (!lesson) return;
    const isCancel = mode === "cancel";
    this.closeAllSwipes();
    this.setData({
      showActionDialog: true,
      actionDialogMode: isCancel ? "cancel" : "start",
      actionDialogTitle: isCancel ? "取消课程" : "开始上课",
      actionDialogContent: isCancel
        ? `确认取消 ${lesson.time} ${lesson.name} 的课程吗？`
        : `确认开始 ${lesson.time} ${lesson.name} 的课程吗？`,
      actionTargetId: id,
      actionRemark: ""
    });
  },

  onActionStartTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    this.openActionDialog("start", id);
  },

  onActionCancelTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    this.openActionDialog("cancel", id);
  },

  onActionDialogMaskTap() {
    this.onActionDialogCancel();
  },

  onActionDialogPanelTap() {},

  onActionDialogCancel() {
    this.setData({
      showActionDialog: false,
      actionDialogMode: "",
      actionDialogTitle: "",
      actionDialogContent: "",
      actionTargetId: "",
      actionRemark: "",
      recordScrollEnabled: true
    });
  },

  onActionRemarkInput(e) {
    this.setData({ actionRemark: e.detail.value || "" });
  },

  onActionDialogConfirm() {
    const mode = this.data.actionDialogMode;
    const targetId = this.data.actionTargetId;
    if (!mode || !targetId) {
      this.onActionDialogCancel();
      return;
    }

    const lessons = [...(this.data.lessons || [])];
    const idx = lessons.findIndex((item) => item && item.id === targetId);
    if (idx < 0) {
      this.onActionDialogCancel();
      return;
    }

    const current = lessons[idx];
    if (mode === "start") {
      if (current.type === "cancelled") {
        this.onActionDialogCancel();
        wx.showToast({ title: "已取消课程无法开始上课", icon: "none" });
        return;
      }
      if (current.type === "done") {
        this.onActionDialogCancel();
        wx.showToast({ title: "该课程已上课", icon: "none" });
        return;
      }
      lessons[idx] = {
        ...current,
        type: "inclass",
        statusText: "上课中",
        _offsetX: 0,
        _startX: 0
      };
      this.setData({ lessons });
      this.onActionDialogCancel();
      wx.showToast({ title: "已标记为上课中", icon: "none" });
      return;
    }

    if (current.type === "cancelled") {
      this.onActionDialogCancel();
      wx.showToast({ title: "该课程已取消", icon: "none" });
      return;
    }
    if (current.type === "done") {
      this.onActionDialogCancel();
      wx.showToast({ title: "已上课课程无法取消", icon: "none" });
      return;
    }

    const reason = String(this.data.actionRemark || "").trim() || DEFAULT_CANCEL_REASON;
    lessons[idx] = {
      ...current,
      type: "cancelled",
      statusText: "已取消",
      place: reason,
      sub: "",
      _offsetX: 0,
      _startX: 0
    };
    this.setData({ lessons });
    this.onActionDialogCancel();
    wx.showToast({ title: "课程已取消", icon: "none" });
  },

  onAddLesson() {
    wx.showToast({ title: "新增排课待接入", icon: "none" });
  }
});
