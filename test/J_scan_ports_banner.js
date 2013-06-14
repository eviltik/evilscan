
var expect = require('chai').expect;
var net = require('net')
var telnet = require('sol-telnet'); // the only one supporting IAC server side
var path = require('path');

var port = 1026;

// Local fake server
var server = function(options,cb) {
    var s = net.createServer(function(sock){
        var ts = new telnet();
        sock.pipe(ts).pipe(sock);

        // Every time you get
        ts.on('lineReceived', function(line){
            console.log('lineReceived',line);
            this.send("Ok there.." + line + "\n")
        })

        // Resize your telnet window and this should change.
        ts.on('clientWindowChangedSize', function(width, height) {
            console.log("NAWS:", width, height);
        })

        // Something odd...
        ts.on("unhandledCommand", function(data) {
            console.log("unhandleCommand",data);
        });

    });

    s.on('connection',function(s) {
        if (!options.timeout) {
            return s.write(options.banner);
        }
        setTimeout(function() {
            return s.write(options.banner);
        },options.timeout);
    });

    /*
    s.on('close',function() {
        console.log('closed');
    });

    s.on('end',function() {
        console.log('end');
    });

    s.on('error',function(err) {
        console.log('error',err);
    });

    s.on('timeout',function() {
        console.log('timeout');
    });
    */

    s.listen(port,function() {
        //console.log('port '+port+' listening');
        cb();
    });

    return s;
}

suite(path.basename(__filename), function(a) {

    var socketTimeout = 100;
    var testTimeout = 300;

    var tcpconnect = require('../libs/tcpconnect');
    tcpconnect.setSocketTimeout(socketTimeout);

    var commonCheck = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('status');
    }

    test('connection refused 127.0.0.1:'+port,function(next) {
        this.timeout(testTimeout);
        tcpconnect.checkPort({host:'127.0.0.1',port:port},function(err,r) {
            commonCheck(r);
            expect(r.status).to.be.equal('close (refused)');
            next();
        });
    });

    /*
    test('connection timeout 127.0.0.1:'+port,function(next) {
        this.timeout(testTimeout);
        var srv = server({timeout:10000,banner:'empty'},function(err) {
            portscan.isOpen({host:'127.0.0.1',port:port},function(err,r) {
                commonCheck(r);
                expect(r.status).to.be.equal('close (timeout)');
                srv.close(next);
            });
        });
    });
    */

    test('connection success 127.0.0.1:'+port,function(next) {
        this.timeout(testTimeout);
        var banner = 'hello\r\nworld\r\n';
        var srv = server({banner:banner},function(err) {
            tcpconnect.checkPort({ip:'127.0.0.1',port:port,timeout:testTimeout-10},function(err,r) {
                commonCheck(r);
                expect(r.status).to.be.equal('open');
                expect(r.banner).to.be.equal('hello\\r\\nworld\\r\\n');
                srv.close(next);
            });
        });
    });


});
