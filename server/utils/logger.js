const log4js = require("log4js"); // log4js是nodejs中的一个日志模块
const logger = log4js.getLogger();
logger.level = "debug";

module.exports = logger;
