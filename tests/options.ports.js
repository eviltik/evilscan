const tester = require('tape');
const path = require('path');
const getPorts = require('../src/libs/options.js').getPorts;

const scriptName = path.basename(__filename);

tester(scriptName+':port: no port specified', (test) => {
    getPorts(null, (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 1, 'result should be an array with one item');
        test.equal(r[0], 0, 'first item should be 0');
        test.end();
    });
});

tester(scriptName+':port: bad port (--port=xy)', (test) => {
    getPorts('xy', (err, r) => {
        test.equal(/invalid port/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

tester(scriptName+':port: valid single port (--port=21)', (test) => {
    getPorts('21', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 1, 'result should be an array with one item');
        test.equal(r[0], 21, 'first item should be 21');
        test.end();
    });
});

tester(scriptName+':port: valid port range (--port=21-23)', (test) => {
    getPorts('21-23', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 3, 'result should be an array with 3 items');
        test.deepEqual(r, [21, 22, 23], 'should return 21, 22, 23');
        test.end();
    });
});

tester(scriptName+':port: valid port list (--port=21,22,23)', (test) => {
    getPorts('21,22,23', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 3, 'result should be an array with 3 items');
        test.deepEqual(r, [21, 22, 23], 'should return 21, 22, 23');
        test.end();
    });
});

tester(scriptName+':port: valid port mixed (--port=21-23,80)', (test) => {
    getPorts('21-23,80', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 4, 'result should be an array with 3 items');
        test.deepEqual(r, [21, 22, 23, 80], 'should return 21, 22, 23, 80');
        test.end();
    });
});

