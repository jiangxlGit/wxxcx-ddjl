import { auth } from "../../services/auth";
import { membersStore } from "../../store/members";

const SWIPE_MAX_OFFSET = -132;
const SWIPE_OPEN_THRESHOLD = -68;
const SWIPE_LOCK_THRESHOLD = 6;
const SCHEDULE_PENDING_TEXT = "待排课";
const DEFAULT_SCHEDULE_DURATION_MINUTES = 60;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function buildTimeRange(startHHmm, durationMinutes = DEFAULT_SCHEDULE_DURATION_MINUTES) {
  const match = String(startHHmm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";

  const startTotal = h * 60 + m;
  const endTotal = (startTotal + Number(durationMinutes || 0)) % (24 * 60);
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;
  return `${pad2(h)}:${pad2(m)}-${pad2(endH)}:${pad2(endM)}`;
}

function splitScheduleTimeLines(rangeText, hasSchedule) {
  if (!hasSchedule) {
    return {
      line1: "未安排",
      line2: "时段"
    };
  }
  const normalized = String(rangeText || "").replace(/[~—–]/g, "-").trim();
  if (!normalized) {
    return {
      line1: "时段",
      line2: "待确认"
    };
  }

  const dashIndex = normalized.indexOf("-");
  if (dashIndex > 0 && dashIndex < normalized.length - 1) {
    return {
      line1: normalized.slice(0, dashIndex).trim(),
      line2: normalized.slice(dashIndex + 1).trim()
    };
  }

  const chunks = normalized.split(/\s+/).filter(Boolean);
  if (chunks.length >= 2) {
    return {
      line1: chunks[0],
      line2: chunks.slice(1).join(" ")
    };
  }

  return {
    line1: normalized,
    line2: ""
  };
}

function getScheduleViewModel(member) {
  const schedule = String((member && member.schedule) || "").trim();
  const rawRange = String((member && member.scheduleRange) || "").trim();
  const isPending = !schedule || schedule === SCHEDULE_PENDING_TEXT || schedule.includes("已结课");
  if (isPending) {
    const timeLines = splitScheduleTimeLines("", false);
    return {
      hasSchedule: false,
      scheduleStatusText: "未排课",
      scheduleRangeText: "未安排时段",
      scheduleTimeLine1: timeLines.line1,
      scheduleTimeLine2: timeLines.line2
    };
  }

  let range = rawRange;
  if (!range) {
    const timeMatch = schedule.match(/(\d{1,2}:\d{2})/);
    if (timeMatch && timeMatch[1]) {
      range = buildTimeRange(timeMatch[1], DEFAULT_SCHEDULE_DURATION_MINUTES);
    }
  }

  const finalRangeText = range || "时段待确认";
  const timeLines = splitScheduleTimeLines(finalRangeText, true);
  return {
    hasSchedule: true,
    scheduleStatusText: "已排课",
    scheduleRangeText: finalRangeText,
    scheduleTimeLine1: timeLines.line1,
    scheduleTimeLine2: timeLines.line2
  };
}

function withScheduleView(list) {
  return (list || []).map((item) => {
    const scheduleView = getScheduleViewModel(item);
    return {
      ...item,
      hasSchedule: scheduleView.hasSchedule,
      scheduleStatusText: scheduleView.scheduleStatusText,
      scheduleRangeText: scheduleView.scheduleRangeText,
      scheduleTimeLine1: scheduleView.scheduleTimeLine1,
      scheduleTimeLine2: scheduleView.scheduleTimeLine2
    };
  });
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

function findMemberIndexById(list, id) {
  return (list || []).findIndex((item) => String(item.id) === String(id));
}

Page({
  data: {
    navSafeHeight: 88,
    memberScrollEnabled: true,
    searchTerm: "",
    members: [],
    filtered: [],
    totalMembers: 0,
    weekNewCount: 0
  },

  onLoad() {
    this.initTopSafe();
  },

  onShow() {
    if (!auth.requireLogin()) return;
    this.getTabBar()?.syncSelected();
    this.refresh();
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
      // Ignore and fallback to status bar + title bar height.
    }

    this.setData({ navSafeHeight });
  },

  refresh() {
    const members = withScheduleView(membersStore.list());
    const filtered = withSwipeState(this.applyFilter(members, this.data.searchTerm));
    const totalMembers = members.length;
    const weekNewCount = members.filter((member) => String(member.schedule || "") === SCHEDULE_PENDING_TEXT).length;
    this.setData({ members, filtered, totalMembers, weekNewCount });
  },

  applyFilter(list, term) {
    const t = String(term || "").trim().toLowerCase();
    if (!t) return list;
    return list.filter((m) => String(m.name || "").toLowerCase().includes(t));
  },

  onSearch(e) {
    const searchTerm = e.detail.value;
    this.setData({
      searchTerm,
      filtered: withSwipeState(this.applyFilter(this.data.members, searchTerm))
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/member-detail/index?id=${encodeURIComponent(id)}` });
  },

  closeSwipeRows(exceptId = "") {
    const filtered = (this.data.filtered || []).map((item) => {
      if (exceptId && String(item.id) === String(exceptId)) return item;
      return { ...item, _offsetX: 0, _lockDir: "", _originOffset: 0 };
    });
    this.setData({ filtered });
  },

  onMemberTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    const touches = e.touches || [];
    if (!touches.length) return;
    const index = findMemberIndexById(this.data.filtered, id);
    if (index < 0) return;

    const filtered = (this.data.filtered || []).map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          _startX: touches[0].clientX,
          _startY: touches[0].clientY,
          _originOffset: Number(item._offsetX) || 0,
          _lockDir: ""
        };
      }
      return { ...item, _offsetX: 0, _lockDir: "", _originOffset: 0 };
    });
    this.setData({ filtered });
  },

  onMemberTouchMove(e) {
    const id = e.currentTarget.dataset.id;
    const touches = e.touches || [];
    if (!touches.length) return;
    const index = findMemberIndexById(this.data.filtered, id);
    if (index < 0) return;

    const filtered = [...this.data.filtered];
    const current = filtered[index];
    if (!current) return;

    const moveX = touches[0].clientX;
    const moveY = touches[0].clientY;
    const dx = moveX - Number(current._startX || 0);
    const dy = moveY - Number(current._startY || 0);

    let lockDir = String(current._lockDir || "");
    if (!lockDir) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx < SWIPE_LOCK_THRESHOLD && absDy < SWIPE_LOCK_THRESHOLD) return;
      if (absDx > absDy + 2) {
        lockDir = "x";
        if (this.data.memberScrollEnabled) this.setData({ memberScrollEnabled: false });
      } else {
        lockDir = "y";
        if (!this.data.memberScrollEnabled) this.setData({ memberScrollEnabled: true });
      }
    }

    if (lockDir !== "x") {
      filtered[index] = { ...current, _lockDir: lockDir };
      this.setData({ filtered });
      return;
    }

    const originOffset = Number(current._originOffset || 0);
    const offset = Math.max(SWIPE_MAX_OFFSET, Math.min(0, originOffset + dx));
    filtered[index] = { ...current, _offsetX: offset, _lockDir: lockDir };
    this.setData({ filtered });
  },

  onMemberTouchEnd(e) {
    const id = e.currentTarget.dataset.id;
    const index = findMemberIndexById(this.data.filtered, id);
    if (index < 0) return;

    const filtered = [...this.data.filtered];
    const current = filtered[index];
    if (!current) return;

    const lockDir = String(current._lockDir || "");
    if (lockDir === "x") {
      const nextOffset = Number(current._offsetX || 0) <= SWIPE_OPEN_THRESHOLD ? SWIPE_MAX_OFFSET : 0;
      filtered[index] = { ...current, _offsetX: nextOffset, _lockDir: "", _originOffset: nextOffset };
    } else {
      filtered[index] = { ...current, _lockDir: "", _originOffset: Number(current._offsetX || 0) };
    }
    this.setData({ filtered });
    if (!this.data.memberScrollEnabled) this.setData({ memberScrollEnabled: true });
  },

  onMemberTouchCancel(e) {
    this.onMemberTouchEnd(e);
  },

  onMemberTap(e) {
    const id = e.currentTarget.dataset.id;
    const index = findMemberIndexById(this.data.filtered, id);
    if (index < 0) return;
    const current = this.data.filtered[index];
    if (current && Number(current._offsetX || 0) !== 0) {
      this.closeSwipeRows();
      return;
    }
    wx.navigateTo({ url: `/pages/member-detail/index?id=${encodeURIComponent(id)}` });
  },

  onActionDetailTap(e) {
    const id = e.currentTarget.dataset.id;
    this.closeSwipeRows(id);
    wx.navigateTo({ url: `/pages/member-detail/index?id=${encodeURIComponent(id)}` });
  },

  onActionScheduleTap(e) {
    const id = e.currentTarget.dataset.id;
    this.closeSwipeRows(id);
    wx.navigateTo({
      url: `/pages/member-detail/index?id=${encodeURIComponent(id)}&openSchedule=1`
    });
  },

  goInvite() {
    wx.navigateTo({ url: "/pages/invite/index" });
  }
});
