"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timers_1 = require("timers");
function sleep(ms) {
    return new Promise((resolve) => {
        timers_1.setTimeout(() => {
            resolve();
        }, ms);
    });
}
exports.sleep = sleep;
function getBytes(text) {
    text = text.toUpperCase();
    const arr = text.match(/\d+/);
    if (!arr || !arr[0]) {
        throw new Error(`invalid input ${text}`);
    }
    let num = parseInt(arr[0], 10);
    if (text.indexOf('G') !== -1) {
        num = num * 1024 * 1024 * 1024;
    }
    else if (text.indexOf('M') !== -1) {
        num = num * 1024 * 1024;
    }
    else if (text.indexOf('K') !== -1) {
        num = num * 1024;
    }
    return num;
}
exports.getBytes = getBytes;
//# sourceMappingURL=util.js.map