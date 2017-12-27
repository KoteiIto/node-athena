"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const typescript_collections_1 = require("typescript-collections");
const util = require("./util");
const defaultMaxBufferSize = '128M';
class AthenaStream extends stream_1.Duplex {
    constructor(config) {
        super({
            readableObjectMode: true,
            writableObjectMode: true,
            allowHalfOpen: false,
        });
        this.buffer = new typescript_collections_1.Queue();
        this.bufferSize = 0;
        this.maxBufferSize = util.getBytes(config.maxBufferSize || defaultMaxBufferSize);
        this.columns = [];
        this.isEnd = false;
        this.on('pipe', (dest) => {
            dest.on('end', () => {
                this.isEnd = true;
            });
        });
        this.on('error', () => {
            this.isEnd = true;
        });
    }
    _write(buffer, _, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.maxBufferSize < this.bufferSize) {
                yield util.sleep(20);
            }
            this.bufferSize += buffer.length;
            this.buffer.enqueue(buffer);
            callback();
            return;
        });
    }
    _read() {
        return __awaiter(this, void 0, void 0, function* () {
            let buffer;
            while (true) {
                if (this.buffer.isEmpty()) {
                    if (this.isEnd) {
                        this.push(null);
                        return;
                    }
                }
                else {
                    buffer = this.buffer.dequeue();
                    if (buffer.length !== 0) {
                        break;
                    }
                }
                yield util.sleep(100);
            }
            this.bufferSize -= buffer.length;
            if (this.columns.length === 0) {
                this.columns = buffer
                    .toString('utf8')
                    .split(',')
                    .map((column) => {
                    return column.substr(1, column.length - 2);
                });
                buffer = this.buffer.dequeue();
                this.bufferSize -= buffer.length;
            }
            const record = {};
            buffer
                .toString('utf8')
                .split(',')
                .forEach((val, i) => {
                const column = this.columns[i] || null;
                if (column !== null) {
                    record[column] = val.substr(1, val.length - 2);
                }
            });
            this.push(record);
            return;
        });
    }
}
exports.AthenaStream = AthenaStream;
//# sourceMappingURL=stream.js.map