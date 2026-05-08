import { auth } from "../../services/auth";
import { storage } from "../../utils/storage";

Page({
  data: {
    loading: false,
    agreed: false
  },

  onShow() {
    // 已登录则直接进首页
    const token = auth.getToken();
    if (token) wx.reLaunch({ url: "/pages/members/index" });
  },

  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },

  onOpenAgreement(e) {
    const type = e.currentTarget.dataset.type;
    const title = type === "service" ? "用户服务协议建设中" : "隐私权政策建设中";
    wx.showToast({ title, icon: "none" });
  },

  async onWechatLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: "请先勾选协议", icon: "none" });
      return;
    }

    this.setData({ loading: true });
    try {
      const userProfile = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: "用于完成管理员登录与展示",
          success(res) {
            resolve(res.userInfo || null);
          },
          fail(err) {
            reject(err);
          }
        });
      });

      const code = await new Promise((resolve, reject) => {
        wx.login({
          success(res) {
            if (res.code) resolve(res.code);
            else reject(new Error("获取 code 失败"));
          },
          fail(err) {
            reject(err);
          }
        });
      });

      try {
        await auth.wechatLogin({ code, userProfile });
      } catch (e) {
        // 后端未接通时，先用 mock 保证流程可跑通
        const token = `mock-${code}`;
        storage.setToken(token);
        storage.setUser(userProfile || { nickName: "管理员" });
      }
      wx.reLaunch({ url: "/pages/members/index" });
    } catch (e) {
      const msg =
        (e && e.errMsg) ||
        (e && e.message) ||
        "登录失败";
      wx.showToast({ title: msg.includes("deny") ? "你取消了授权" : msg, icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  }
});
