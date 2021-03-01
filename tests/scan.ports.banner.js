const tester = require('tape');
const net = require('net');
const telnet = require('sol-telnet'); // the only one supporting IAC server side
const path = require('path');
const Evilscan = require('../');

const scriptName = path.basename(__filename);
const port = 1026;

// Local fake server
const server = function(options, cb) {
    const s = net.createServer(sock => {
        const ts = new telnet();
        sock.pipe(ts).pipe(sock);
    }).on('connection', s => {
        setTimeout(() => {
            return s.write(options.banner);
        }, options.timeout||0);
    }).listen(port, cb);
    return s;
};


const socketTimeout = 100;
const testTimeout = 300;

const opts = {
    target:'127.0.0.1',
    port,
    timeout:socketTimeout,
    banner:true
};

const commonCheck = (test, r) => {
    test.equal(typeof r, 'object', 'result should be an object');
    test.equal(typeof r.status, 'string', 'status should be a string');
};

tester(scriptName+':connection should be refused 127.0.0.1:'+port, { timeout: testTimeout }, (test) => {

    new Evilscan(opts)
        .on('error', err => {
            throw new Error(err);
        })
        .on('result', r => {
            commonCheck(test, r);
            test.equal(r.status, 'close (refused)', 'status should be close (refused)');
        })
        .on('done', () => {
            test.end();
        })
        .run();

});

tester(scriptName+':connection should be ok 127.0.0.1:'+port, { timeout: testTimeout }, (test) => {

    const banner = 'hello\r\nworld\r\n';
    const srv = server({ banner }, (err) => {
        test.equal(err, undefined, 'create telnet server error should be undefined');
        new Evilscan(opts)
            .on('error', err => {
                throw new Error(err);
            })
            .on('result', r => {
                commonCheck(test, r);
                test.equal(r.status, 'open', 'status should be open');
                test.equal(r.banner, 'hello\\r\\nworld\\r\\n', 'should return the banner');
            })
            .on('done', () => {
                srv.close(() => {
                    test.end();
                });
            })
            .run();
    });
});
