#!/usr/bin/env node

const fs = require("fs");
const path = require('path') // nodejs内置路径模块
const runCmd = require("../server/utils/runCmd");
const logger = require("../server/utils/logger");


// 定义一个部署类
class Deploy {
  constructor() {}

  async start(args) {
    console.log("==start====args", args);
    // 存储参数，用于多文件传参
    // process.cwd(): 项目根目录
    const argsPath = path.join(process.cwd(),'args.json');
    console.log('======argsPath: ', argsPath);
    fs.writeFileSync(argsPath, JSON.stringify(args));
    // 删除原先的服务
    runCmd("pm2", ["delete", "vndeploy"], () => {});
    // // 防止异步并行，sleep 1s
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 开启 pm2 服务, 并命名为 vndeploy
    // pm2 start index.js --n [name]
    console.log('======__dirname: ', __dirname);
    const argv = ["start", __dirname + "/../server/index.js", "-n", "vndeploy"];
    runCmd("pm2", argv, (text) => {
      logger.log(text);
    });
  }
}

module.exports = function start(args) {
  let deploy = new Deploy();
  deploy.start(args); // 启动服务
};
