Component({
  properties: {
    title: { type: String, value: "" },
    active: { type: String, value: "" },
    tabs: { type: Array, value: [] }
  },
  methods: {
    onTap(e) {
      const key = e.currentTarget.dataset.key;
      this.triggerEvent("change", { key });
    }
  }
});

