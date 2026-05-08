import { env } from "../config/env";
import { storage } from "./storage";

function normalizeError(err) {
  if (!err) return { message: "未知错误" };
  if (typeof err === "string") return { message: err };
  if (err.errMsg) return { message: err.errMsg };
  if (err.message) return { message: err.message };
  return { message: "请求失败" };
}

export function request(options) {
  const token = storage.getToken();
  const header = {
    "Content-Type": "application/json",
    ...(options.header || {})
  };
  if (token) header.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${env.baseURL}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header,
      timeout: options.timeout || 15000,
      success(res) {
        const { statusCode, data } = res || {};
        if (statusCode >= 200 && statusCode < 300) return resolve(data);
        if (statusCode === 401) {
          storage.clearToken();
          storage.clearUser();
          wx.reLaunch({ url: "/pages/login/index" });
        }
        reject({ message: (data && data.message) || `HTTP ${statusCode}` });
      },
      fail(err) {
        reject(normalizeError(err));
      }
    });
  });
}

