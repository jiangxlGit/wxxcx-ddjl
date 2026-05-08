Component({
  properties: {
    active: { type: String, value: "" },
    tabs: {
      type: Array,
      value: [
        { id: "members", label: "学员", url: "/pages/members/index" },
        { id: "today", label: "课表", url: "/pages/today-v2/index" },
        { id: "stats", label: "统计", url: "/pages/stats/index" }
      ]
    }
  },
  methods: {
    onTap(e) {
      const id = e.currentTarget.dataset.id;
      const tab = (this.data.tabs || []).find((t) => t.id === id);
      if (!tab || !tab.url) return;
      this.triggerEvent("change", { id, url: tab.url });
    }
  }
});
