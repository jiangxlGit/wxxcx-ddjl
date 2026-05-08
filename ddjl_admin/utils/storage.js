const TOKEN_KEY = "DDJL_ADMIN_TOKEN";
const USER_KEY = "DDJL_ADMIN_USER";

export const storage = {
  getToken() {
    return wx.getStorageSync(TOKEN_KEY) || "";
  },
  setToken(token) {
    wx.setStorageSync(TOKEN_KEY, token || "");
  },
  clearToken() {
    wx.removeStorageSync(TOKEN_KEY);
  },
  getUser() {
    return wx.getStorageSync(USER_KEY) || null;
  },
  setUser(user) {
    wx.setStorageSync(USER_KEY, user || null);
  },
  clearUser() {
    wx.removeStorageSync(USER_KEY);
  }
};

