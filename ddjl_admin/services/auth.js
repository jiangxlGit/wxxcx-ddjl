import { request } from "../utils/request";
import { storage } from "../utils/storage";

export const auth = {
  getToken() {
    return storage.getToken();
  },

  requireLogin() {
    const token = storage.getToken();
    if (token) return true;
    wx.reLaunch({ url: "/pages/login/index" });
    return false;
  },

  async wechatLogin({ code, userProfile }) {
    // 期望后端返回：{ token: string, user: object }
    // 后端接口名可按你项目调整（这里用 /admin/wechatLogin 占位）
    const data = await request({
      url: "/admin/wechatLogin",
      method: "POST",
      data: { code, userProfile }
    });
    if (data && data.token) storage.setToken(data.token);
    if (data && data.user) storage.setUser(data.user);
    return data;
  },

  logout() {
    storage.clearToken();
    storage.clearUser();
  }
};
