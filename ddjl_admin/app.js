import { auth } from "./services/auth";

App({
  globalData: {
    token: "",
    user: null
  },

  onLaunch() {
    const token = auth.getToken();
    if (token) this.globalData.token = token;
  }
});

