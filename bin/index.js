const { program } = require("commander");
const prompts = require("prompts");
const chalk = require('chalk');

const pkg = require("../package.json");
const start = require("./start");


// 初始化
// vn-node-deploy start
// vn-node-deploy start -p 2345 -w 123456
module.exports = function init() {
    console.log(chalk.blue(`---------------- 欢迎使用 ${pkg.name} 脚手架工具 ----------------`));
    program
        .command("start")
        .description(chalk.greenBright("🚀🚀🚀🚀🚀开启部署监听服务🚀🚀🚀🚀🚀")) // description + action 可防止查找 command拼接文件
        .version(pkg.version)
        .option("-p, --port <port>", "指定部署服务监听端口")
        .option("-w, --password <key>", "设置登录密码")
        .action(async (options) => {
            console.log("=====options", options);
            let { port, password } = options;
            const args =
            port && password
                ? { port, password }
                : await prompts([
                    {
                    type: "number",
                    name: "port",
                    initial: 8888,
                    message: "请输入部署服务端口：",
                    validate: (value) =>
                        value !== "" && (value < 3000 || value > 10000)
                        ? `端口号必须在 3000 - 10000 之间`
                        : true,
                    },
                    {
                    type: "password",
                    name: "password",
                    initial: "123456",
                    message: "请设置登录密码（默认：123456）",
                    validate: (value) =>
                        value.length < 6 ? `密码需要 6 位以上` : true,
                    },
                ]);
            
            // 启动服务   
            start(args); // args 为 { port: 8888, password: '123456' }

        });

    program.parse(process.argv); // 解析命令行参数: 这一步必不可少，否则上面的定义都不会生效

}


