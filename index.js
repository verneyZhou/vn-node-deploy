#!/usr/bin/env node

// 文件以#!开头代表这个文件被当做一个执行文件来执行，可以当做脚本运行。后面的/usr/bin/env node代表这个文件用node执行，node基于用户安装根目录下的环境变量中查找


const init = require('./bin/index.js');

init();