"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const index_1 = require("../index");
describe('Array', () => {
    describe('#createClient import defalut()', () => {
        it('should return athenaClient', (done) => {
            const client = index_1.default.createClient({ bucketUri: 's3://xxxx' }, { region: 'xxxx' });
            assert.notEqual(client, undefined);
            done();
        });
    });
});
//# sourceMappingURL=index_default.js.map