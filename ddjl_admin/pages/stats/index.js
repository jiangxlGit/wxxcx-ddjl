import { auth } from "../../services/auth";
import { membersStore } from "../../store/members";
import { todayISO } from "../../utils/date";

const WEEK_TEXT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const REVENUE_BARS = [
  { week: "W1", height: 96 },
  { week: "W2", height: 156 },
  { week: "W3", height: 120 },
  { week: "W4", height: 206, active: true },
  { week: "W5", height: 110 },
  { week: "W6", height: 170 }
];
const COURSE_CURVE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg width="680" height="280" viewBox="0 0 340 140" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 118 C72 112 104 88 132 52 C164 12 202 50 226 88 C252 128 286 82 306 6" fill="none" stroke="#B5165A" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M300 8 C320 0 330 34 326 78" fill="none" stroke="#F58BAE" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="126" cy="52" r="5.6" fill="#FFFFFF" stroke="#B5165A" stroke-width="2.8"/>
    <circle cx="306" cy="6" r="5.6" fill="#FFFFFF" stroke="#B5165A" stroke-width="2.8"/>
  </svg>`
)}`;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseISO(iso) {
  const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toISO(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDaysFromISO(iso, offset) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + offset);
  return toISO(date);
}

function withCommas(value) {
  return String(Math.max(0, Math.round(Number(value) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isCancelled(member) {
  const text = `${member && member.schedule ? member.schedule : ""} ${member && member.location ? member.location : ""}`;
  return text.includes("取消") || text.includes("已取消");
}

function getDailyStats(date, members) {
  const dayMembers = members.filter((m) => m.schedule && String(m.schedule).startsWith(date));
  const cancelled = dayMembers.filter(isCancelled).length;
  const completed = dayMembers.filter((m) => m.isCompletedToday && !isCancelled(m)).length;
  const pending = dayMembers.filter((m) => !m.isCompletedToday && !isCancelled(m) && m.schedule !== "待排课").length;
  const revenue = dayMembers
    .filter((m) => m.isCompletedToday && !isCancelled(m))
    .reduce((acc, m) => acc + (m.lessonPrice || 300), 0);

  return {
    completed,
    pending,
    cancelled,
    revenue,
    revenueMain: withCommas(revenue)
  };
}

function getDayMembers(date, members) {
  return members.filter((m) => m.schedule && String(m.schedule).startsWith(date));
}

function buildDays(centerDate = todayISO()) {
  const offsets = [-3, -2, -1, 0, 1, 2, 3];
  return offsets.map((offset) => {
    const date = addDaysFromISO(centerDate, offset);
    const d = parseISO(date);
    return {
      date,
      week: WEEK_TEXT[d.getDay()],
      day: d.getDate()
    };
  });
}

function getCourseTotal(members) {
  return members.reduce((acc, member) => acc + (Number(member.completedLessons) || 0), 0);
}

function getRevenueForecast(members) {
  const total = members.reduce((acc, member) => acc + (Number(member.totalPrice) || 0), 0);
  return `¥${(total / 1000).toFixed(1)}k`;
}

function getAiAdvice(date, members, seed = 0) {
  const dayMembers = getDayMembers(date, members);
  const cancelled = dayMembers.filter(isCancelled).length;
  const pendingMembers = dayMembers.filter((m) => !m.isCompletedToday && !isCancelled(m));
  const completed = dayMembers.filter((m) => m.isCompletedToday && !isCancelled(m)).length;
  const waitingMembers = members.filter((m) => String(m.schedule || "") === "待排课");
  const names = pendingMembers
    .slice(0, 2)
    .map((m) => m.name)
    .filter(Boolean)
    .join("、");
  const waitingName = waitingMembers[seed % Math.max(waitingMembers.length, 1)]?.name || "待排课学员";
  const options = [
    cancelled > 0
      ? `今日有 ${cancelled} 节取消课，建议优先把释放出的时段补给 ${waitingName}，并同步确认训练地点。`
      : `今日课程稳定，建议把 15:00 - 17:00 作为补课窗口，优先联系 ${waitingName} 完成复课预约。`,
    pendingMembers.length > 0
      ? `当前仍有 ${pendingMembers.length} 节未上课，建议提前 2 小时提醒${names ? ` ${names}` : "学员"}，降低临时改约概率。`
      : `当前日期暂无待上课程，建议开放晚间 19:00 后时段，用于承接新增会员体验课。`,
    completed > 0
      ? `已有 ${completed} 节完成课，建议课后 30 分钟内发送反馈记录，并顺手预约下一次训练。`
      : `今日还没有已完成课程，建议先检查上午和晚间黄金时段，避免空档过长影响转化。`
  ];

  return options[seed % options.length];
}

Page({
  data: {
    navSafeHeight: 88,
    statDate: todayISO(),
    days: buildDays(),
    updatedAt: "--:--",
    daily: { completed: 0, pending: 0, cancelled: 0, revenue: 0, revenueMain: "0" },
    membersCount: 0,
    aiAdvice: "",
    aiUpdatedAt: "--:--",
    aiAdviceSeed: 0,
    courseTotal: 0,
    courseCurveSvg: COURSE_CURVE_SVG,
    revenueForecast: "¥0.0k",
    revenueBars: REVENUE_BARS
  },

  onLoad() {
    this.initTopSafe();
    this.refresh();
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
      // Fallback is enough for simulators that do not expose the capsule metrics.
    }

    this.setData({ navSafeHeight });
  },

  refresh() {
    const members = membersStore.list();
    const daily = getDailyStats(this.data.statDate, members);
    const updatedAt = formatTime();
    this.setData({
      membersCount: members.length,
      updatedAt,
      daily,
      aiAdvice: getAiAdvice(this.data.statDate, members, this.data.aiAdviceSeed),
      aiUpdatedAt: updatedAt,
      courseTotal: getCourseTotal(members),
      revenueForecast: getRevenueForecast(members)
    });
  },

  onPickDate(e) {
    const statDate = e.currentTarget.dataset.date;
    this.setData({ statDate, days: buildDays(statDate) }, () => this.refresh());
  },

  onLocateToday() {
    this.setData({ statDate: todayISO(), days: buildDays() }, () => this.refresh());
  },

  onRefreshAiAdvice() {
    const members = membersStore.list();
    const aiAdviceSeed = this.data.aiAdviceSeed + 1;
    this.setData({
      aiAdviceSeed,
      aiAdvice: getAiAdvice(this.data.statDate, members, aiAdviceSeed),
      aiUpdatedAt: formatTime()
    });
  }
});
