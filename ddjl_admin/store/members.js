import { todayISO } from "../utils/date";

const INITIAL_MEMBERS = [
  {
    id: "1",
    name: "王小美",
    phone: "13800138001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=WangXiaomei",
    remainingLessons: 12,
    completedLessons: 12,
    totalLessons: 24,
    totalPrice: 7680,
    schedule: `${todayISO()} 09:00`,
    location: "奥美健身房 · 力量区",
    lessonPrice: 320,
    isCompletedToday: false,
    note: "课表同步学员，当前为塑形强化阶段。"
  },
  {
    id: "2",
    name: "李建国",
    phone: "13800138002",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LiJianguo",
    remainingLessons: 0,
    completedLessons: 1,
    totalLessons: 1,
    totalPrice: 299,
    schedule: `${todayISO()} 11:00`,
    location: "叮叮工作室 · 私教1室",
    lessonPrice: 299,
    isCompletedToday: false,
    note: "课表同步学员，体验课用户。"
  },
  {
    id: "3",
    name: "张思睿",
    phone: "13800138003",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangSirui",
    remainingLessons: 6,
    completedLessons: 4,
    totalLessons: 10,
    totalPrice: 3000,
    schedule: `${todayISO()} 14:30`,
    location: "因会员临时出差取消",
    lessonPrice: 300,
    isCompletedToday: false,
    note: "课表同步学员，近期排课需提前确认出勤。"
  },
  {
    id: "4",
    name: "陈雨欣",
    phone: "13800138004",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChenYuxin",
    remainingLessons: 0,
    completedLessons: 20,
    totalLessons: 20,
    totalPrice: 7200,
    schedule: `${todayISO()} 16:00`,
    location: "奥美健身房 · 操房",
    lessonPrice: 360,
    isCompletedToday: false,
    note: "课表同步学员，已完成当期课包。"
  },
  {
    id: "5",
    name: "赵明远",
    phone: "13800138005",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ZhaoMingyuan",
    remainingLessons: 5,
    completedLessons: 5,
    totalLessons: 10,
    totalPrice: 4200,
    schedule: `${todayISO()} 19:00`,
    location: "叮叮工作室 · 私教2室",
    lessonPrice: 420,
    isCompletedToday: false,
    note: "课表同步学员，晚间课程为主。"
  },
  {
    id: "6",
    name: "林悦然",
    phone: "13800138006",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LinYueran",
    remainingLessons: 8,
    completedLessons: 10,
    totalLessons: 18,
    totalPrice: 6120,
    schedule: `${todayISO()} 10:30`,
    location: "叮叮工作室 · 私教3室",
    lessonPrice: 340,
    isCompletedToday: false,
    note: "新增会员，核心与臀腿训练并行。"
  },
  {
    id: "7",
    name: "沈思语",
    phone: "13800138007",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ShenSiyu",
    remainingLessons: 15,
    completedLessons: 5,
    totalLessons: 20,
    totalPrice: 7000,
    schedule: "待排课",
    location: "",
    lessonPrice: 350,
    isCompletedToday: false,
    note: "新增会员，柔韧性基础较好。"
  },
  {
    id: "8",
    name: "吴晨曦",
    phone: "13800138008",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=WuChenxi",
    remainingLessons: 11,
    completedLessons: 1,
    totalLessons: 12,
    totalPrice: 3960,
    schedule: "待排课",
    location: "",
    lessonPrice: 330,
    isCompletedToday: false,
    note: "新增会员，体态矫正需求明确。"
  },
  {
    id: "9",
    name: "周子航",
    phone: "13800138009",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ZhouZihang",
    remainingLessons: 4,
    completedLessons: 8,
    totalLessons: 12,
    totalPrice: 4200,
    schedule: `${todayISO()} 18:00`,
    location: "奥美健身房 · 功能区",
    lessonPrice: 350,
    isCompletedToday: false,
    note: "新增会员，偏力量增肌目标。"
  },
  {
    id: "10",
    name: "许安然",
    phone: "13800138010",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=XuAnran",
    remainingLessons: 9,
    completedLessons: 3,
    totalLessons: 12,
    totalPrice: 4080,
    schedule: `${todayISO()} 20:30`,
    location: "叮叮工作室 · 私教2室",
    lessonPrice: 340,
    isCompletedToday: false,
    note: "新增会员，训练频率稳定。"
  }
];

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

export const membersStore = {
  _members: clone(INITIAL_MEMBERS),

  _ensureMembers() {
    if (!Array.isArray(this._members) || this._members.length === 0) {
      this._members = clone(INITIAL_MEMBERS);
    }
  },

  list() {
    this._ensureMembers();
    return clone(this._members);
  },

  getById(id) {
    this._ensureMembers();
    return clone(this._members.find((m) => m.id === id) || null);
  },

  update(updated) {
    this._ensureMembers();
    this._members = this._members.map((m) => (m.id === updated.id ? { ...m, ...updated } : m));
    return this.getById(updated.id);
  },

  completeLesson(memberId) {
    this._ensureMembers();
    const target = this._members.find((m) => m.id === memberId);
    if (!target || target.remainingLessons <= 0) return this.getById(memberId);
    const date = String(target.schedule || "").split(" ")[0] || todayISO();
    const updated = {
      ...target,
      remainingLessons: target.remainingLessons - 1,
      completedLessons: (target.completedLessons || 0) + 1,
      schedule: `${date} (已结课)`,
      isCompletedToday: true
    };
    return this.update(updated);
  },

  cancelReservation(memberId) {
    this._ensureMembers();
    const target = this._members.find((m) => m.id === memberId);
    if (!target) return null;
    const updated = { ...target, schedule: "待排课", location: "", isCompletedToday: false };
    return this.update(updated);
  },

  schedule(memberId, { date, time, location }) {
    this._ensureMembers();
    const target = this._members.find((m) => m.id === memberId);
    if (!target) return null;
    const updated = {
      ...target,
      schedule: `${date} ${time}`,
      location: location || "主场工作室",
      isCompletedToday: false
    };
    return this.update(updated);
  }
};
