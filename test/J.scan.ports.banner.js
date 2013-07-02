
var expect = require('chai').expect;
var net = require('net')
var telnet = require('sol-telnet'); // the only one supporting IAC server side
var path = require('path');
var evilscan = require('../');
var port = 1026;

// Local fake server
var server = function(options,cb) {
    var s = net.createServer(function(sock){
        var ts = new telnet();
        sock.pipe(ts).pipe(sock);

    }).on('connection',function(s) {
        setTimeout(function() {
            return s.write(options.banner);
        },options.timeout||0);
    }).listen(port,cb)
    return s;
}

suite(path.basename(__filename), function(a) {

    var socketTimeout = 100;
    var testTimeout = 300;

    var opts = {
        target:'127.0.0.1',
        port:port,
        timeout:socketTimeout,
        banner:true
    };

    var tcpconnect = require('../libs/tcpconnect');

    var commonCheck = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('status');
    }

    test('connection should be refused 127.0.0.1:'+port,function(next) {

        this.timeout(testTimeout);

        new evilscan(opts)
            .on('error',function(err) {
                throw new Error(data.toString());
            })
            .on('result',function(r) {
                commonCheck(r);
                expect(r.status).to.be.equal('close (refused)');
            })
            .on('done',function() {
                next();
            })
            .run();

    });


    test('connection should be ok 127.0.0.1:'+port,function(next) {
        this.timeout(testTimeout);
        var banner = 'hello\r\nworld\r\n';
        var srv = server({banner:banner},function(err) {

            new evilscan(opts)
                .on('error',function(err) {
                    throw new Error(data.toString());
                })
                .on('result',function(r) {
                    commonCheck(r);
                    expect(r.status).to.be.equal('open');
                    expect(r.banner).to.be.equal('hello\\r\\nworld\\r\\n');
                })
                .on('done',function() {
                    srv.close(next);
                })
                .run();
        });
    });

});
