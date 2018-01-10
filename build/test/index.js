"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const athena = require("../index");
describe('Array', () => {
    describe('#execute()', () => {
        it('should return athenaClient', (done) => {
            const client = athena.createClient({ bucketUri: 's3://xxxx' }, { region: 'xxxx' });
            assert.notEqual(client, undefined);
            done();
        });
    });
});
//# sourceMappingURL=index.js.map