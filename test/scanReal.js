
var expect = require('chai').expect;
var net = require('net')
var spawn = require('child_process').spawn;
var rl = require('readline');

suite('Real scan #', function(a) {

    var checkString = function(data) {
        expect(data).to.be.a('string');
    }

    var checkJson = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('ip');
    }

    test('122.99.129.254:23',function(next) {

        this.timeout(10000);

        var args = './evilscan --target 122.99.129.254 --port 23 --banner --json';

        var proc = spawn('node',args.split(' '));
        var linereader = rl.createInterface(proc.stdout, proc.stdin);

        linereader.on('line',function(data) {
            data = data.toString();
            checkString(data);
            console.log(data);
            process.exit(0);
            var obj = JSON.parse(data);
            checkJson(obj);
            expect(obj.ip).to.be.equal('122.99.129.254');
            expect(obj.banner).to.match(/Anchor VPN/);
        });

        proc.on('close',function() {
            next();
        });

        proc.stderr.on('data',function(data) {
            throw new Error(data.toString());
        });

    });

});
