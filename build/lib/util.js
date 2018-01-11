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
//# sourceMappingURL=util.js.map