const fs = require("fs");
// child_process 模块允许打开一个子进程去执行其他任务，该功能使 node 程序可以执行指定的 shell 脚本，可以用于自动化部署、定时任务
// 使用 spawn() 方法可以创建一个新的子进程，用于执行命令
const { spawn } = require('child_process'); 

const logger = require("./logger");


let timeoutTimer = undefined;

// 使用子进程执行命令
function runCmd(cmd, args, callback, socketIo, msgTag = "common-msg", timeoutMinute = 2) {
  // 创建一个新的子进程去执行命令
  // 如：spawn("pm2", ["start","index.js"])是执行脚本：pm2 start index.js
  const child = spawn(cmd, args);
  // socket将消息实时返回给前端   
  socketIo && socketIo.emit(msgTag, `[system] runCmd: ${args[0]}, ${msgTag}`);
  socketIo && socketIo.emit(msgTag, `[system] 超时限制：${timeoutMinute} 分钟;`);

//   let resp = "";
  let resp = "当前执行路径：" + process.cwd() + "\n";
  logger.info(resp);
  socketIo && socketIo.emit(msgTag, resp);
  let shellCmd = cmd + " " + args + "\n";
  
  // 读取.sh文件的脚本内容  
  let shellText = args[0].includes(".sh") ? fs.readFileSync(args[0] || "").toString() : "";

 // 将脚本执行信息返给前端  
  socketIo && socketIo.emit(msgTag, `开始执行脚本： ${shellCmd}`);
  socketIo && socketIo.emit(msgTag, `--------------`);
  socketIo && socketIo.emit(msgTag, shellText);
  socketIo && socketIo.emit(msgTag, `--------------`);
  socketIo && socketIo.emit(msgTag, `>>> [system] child pid ${child.pid}, 正在运行中....`);
  let startTime = +new Date();

 // 进程的输出信息  
  let dataFunc = (buffer) => {
    // 如果已结束
    if (child.killed) {
      callback("运行超时，已停止", "isError");
      timeoutTimer && clearTimeout(timeoutTimer);
      socketIo && socketIo.emit(msgTag, `[system] ${child.pid} child.killed, 结束`);
      // fix 进程被 kill 后，还在不断接收数据问题（使用 pm2 log 测试得出该结论）
      child.stdout.off("data", dataFunc);
      return;
    }
    // 输出
    let info = buffer.toString();
    info = `${new Date().toLocaleString()}: ${info}`;
    resp += info;
    logger.info('====stdout.on:', info);
    socketIo && socketIo.emit(msgTag, info);
    // console.log(child);
    // log 较多时，怎么实时将消息通过接口返给前端，只能是 socket ？
    // 除了 socket 怎么将 log 数据一点点通过接口传给前端
  };

  // 监听子进程的输出   
  child.stdout.on("data", dataFunc);
  // 监听子进程的退出   
  child.stdout.on("end", function () {
    console.log(">>stdout end");
    callback(resp);
    timeoutTimer && clearTimeout(timeoutTimer);
    // socketIo && socketIo.emit(msgTag, `[system] child stdout end`);
  });


  // shell 脚本执行错误信息也返回
  // let errorMsg = ""; // 错误信息 end、正常信息 end 可能有先后，统一成一个信息
  // 监听子进程的错误输出   
  child.stderr.on("data", (buffer) => {
    let info = buffer.toString();
    info = `${new Date().toLocaleString()}: ${info}`;
    resp += info;
    logger.info('====stderr.on:',info);
    socketIo && socketIo.emit(msgTag, info);
  });   
  child.stderr.on("end", function () {
    console.log(">>err end");
    callback(resp);
    timeoutTimer && clearTimeout(timeoutTimer); // 清除超时定时器
    // socketIo && socketIo.emit(msgTag, `[system] child stderr end`);
  });


  // 监听子进程的退出
  child.on("close", (code) => {
    console.log(">>close", code);
    if (code !== 0) {
      // let log = `[system] child 子进程非正常退出，ps process exited with code ${code}`;
      // socketIo && socketIo.emit(msgTag, log);
    }
    let useTime = (+new Date() - startTime) / 1000;
    socketIo &&
      socketIo.emit(
        msgTag,
        `>>> [system] ${child.pid} child close 完成运行! 耗时：${useTime}s`
      );
  });


  // 超时处理  
  const TIME_OUT_SEC = 1000 * 60 * timeoutMinute;
  timeoutTimer = setTimeout(() => {
    let log = `>>> [system]  ${child.pid} 执行超时 ${TIME_OUT_SEC / 1000}s，结束执行!`;
    socketIo && socketIo.emit(msgTag, log);
    child.kill(); // 杀死子进程
  }, TIME_OUT_SEC);
}

module.exports = runCmd;
