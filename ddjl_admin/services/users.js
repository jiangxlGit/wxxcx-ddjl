import { request } from "../utils/request";

export const usersService = {
  list(params) {
    return request({
      url: "/admin/users",
      method: "GET",
      data: params
    });
  }
};

