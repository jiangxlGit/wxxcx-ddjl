// components/tab-bar/index.js

const TAB_PATHS = [
  "pages/members/index",
  "pages/today-v2/index",
  "pages/stats/index"
];

function isTabPath(path) {
  return TAB_PATHS.includes(path);
}

Component({
  data: {
    selectedPath: "pages/members/index"
  },

  methods: {
    normalizePath(path) {
      return String(path || "").replace(/^\//, "");
    },

    getCurrentRoute() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      return this.normalizePath(current?.route);
    },

    // ✅ 唯一可信来源：当前页面路由
    syncSelected() {
      const route = this.getCurrentRoute();
      const selectedPath = isTabPath(route)
        ? route
        : "pages/members/index";

      // ⚠️ 不做相等判断，强制覆盖，避免状态卡死
      this.setData({ selectedPath });
    },

    onSwitchTab(e) {
      const targetPath = this.normalizePath(e.currentTarget.dataset.path);
      if (!isTabPath(targetPath)) return;

      const current = this.getCurrentRoute();

      // 已在当前 tab
      if (current === targetPath) {
        this.syncSelected();
        return;
      }

      // 简单防抖（防止连点）
      const now = Date.now();
      if (this._lastTap && now - this._lastTap < 300) return;
      this._lastTap = now;

      wx.switchTab({
        url: `/${targetPath}`
      });
    }
  },

  lifetimes: {
    attached() {
      this._lastTap = 0;
      this.syncSelected();
    }
  }
});