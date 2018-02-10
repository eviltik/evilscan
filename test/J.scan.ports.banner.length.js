const expect = require('chai').expect;
const net = require('net')
const telnet = require('sol-telnet'); // the only one supporting IAC server side
const path = require('path');
const evilscan = require('../');
const port = 1026;

// Local fake server
const server = function(options,cb) {
    let s = net.createServer(function(sock){
        let ts = new telnet();
        sock.pipe(ts).pipe(sock);

    }).on('connection',(s) => {
        setTimeout(() => {
            return s.write(options.banner);
        },options.timeout||0);
    }).listen(port,cb)
    return s;
}

suite(path.basename(__filename), (a) => {

    let socketTimeout = 100;
    let testTimeout = 300;

    let opts = {
        target:'127.0.0.1',
        port:port,
        timeout:socketTimeout,
        banner:true,
        bannerlen:2
    };

    let commonCheck = (r) => {
        expect(r).to.be.a('object');
        expect(r).to.have.property('status');
    }

    test('connection should be refused 127.0.0.1:'+port, function(next) {

        this.timeout(testTimeout);

        new evilscan(opts)
            .on('error', err => {throw new Error(data.toString())})
            .on('result', r => {
                commonCheck(r);
                expect(r.status).to.be.equal('close (refused)');
            })
            .on('done',() => {
                next();
            })
            .run();

    });


    test('connection should be ok 127.0.0.1:'+port, function(next) {

        this.timeout(testTimeout);

        var banner = 'hello\r\nworld\r\n';
        var srv = server({banner:banner},err => {

            new evilscan(opts)
                .on('error', err => {throw new Error(data.toString())})
                .on('result', r => {
                    commonCheck(r);
                    expect(r.status).to.be.equal('open');
                    expect(r.banner).to.be.equal('he');
                })
                .on('done', () => {
                    srv.close(next);
                })
                .run();
        });
    });

});
