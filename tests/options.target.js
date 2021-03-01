const tester = require('tape');
const path = require('path');
const getTargets = require('../src/libs/options.js').getTargets;

const scriptName = path.basename(__filename);

tester(scriptName+':target: no target specified', (test) => {
    getTargets(null, (err, r) => {
        test.equal(/target/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

tester(scriptName+':target: bad ipv4 327.0.0.10', (test) => {
    getTargets('327.0.0.10', (err, r) => {
        test.equal(/not a valid/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

tester(scriptName+':target: unsupported ipv6 2001:db8:0:85a3:0:0:ac1f:8001', (test) => {
    getTargets('2001:db8:0:85a3:0:0:ac1f:8001', (err, r) => {
        test.equal(/not supported/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

tester(scriptName+':target: valid ipv4 127.0.0.1', (test) => {
    getTargets('127.0.0.1', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 1, 'result should be an array with 1 item');
        test.deepEqual(r[0], '127.0.0.1', 'should return 127.0.0.1');
        test.end();
    });
});

tester(scriptName+':target: invalid ipv4 cidr: 127.0.0.1/xy', (test) => {
    getTargets('127.0.0.1/xy', (err, r) => {
        test.equal(/invalid IPv4 CIDR/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

tester(scriptName+':target: invalid ipv4 cidr 327.0.0.1/24', (test) => {
    getTargets('327.0.0.1/24', (err, r) => {
        test.equal(/invalid IPv4 CIDR/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

tester(scriptName+':target: valid ipv4 cidr: 127.0.0.1/24', (test) => {
    getTargets('127.0.0.1/24', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 253, 'result should be an array with 253 items');
        test.deepEqual(r[0], '127.0.0.1', 'first item should be 127.0.0.1');
        test.deepEqual(r[r.length-1], '127.0.0.253', 'last item should be 127.0.0.253');
        test.end();
    });
});

tester(scriptName+':target: resolve existing host google.com', (test) => {
    getTargets('google.com', (err, r) => {
        test.equal(err, null, 'should not return an error');
        test.equal(Array.isArray(r), true, 'result should be an array');
        test.equal(r.length, 1, 'result should be an array with 1 item');
        test.comment(r[0]);
        test.end();
    });
});

tester(scriptName+':target: resolve unexisting host: xxgooglez123.tv', (test) => {
    getTargets('xxgooglez123tv', (err, r) => {
        test.equal(/Could not resolve/i.test(err), true, 'should return '+err);
        test.equal(r, undefined, 'should not return result');
        test.end();
    });
});

