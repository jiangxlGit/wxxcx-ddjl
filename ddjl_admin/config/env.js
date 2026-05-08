const ENV = {
  dev: {
    baseURL: "https://example.com/api"
  },
  prod: {
    baseURL: "https://example.com/api"
  }
};

function getEnvKey() {
  // 微信小程序没有标准 NODE_ENV，默认走 dev；可按需改成读取小程序环境变量/版本号
  return "dev";
}

export const env = ENV[getEnvKey()];

