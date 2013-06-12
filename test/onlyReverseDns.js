
var expect = require('chai').expect;
var net = require('net')
var spawn = require('child_process').spawn;
var rl = require('readline');

suite('Reverse dns only #', function(a) {

    var checkString = function(data) {
        expect(data).to.be.a('string');
    }

    var checkJson = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('ip');
    }

    test('64.4.11.37 should return 00001001.ch',function(next) {

        var args = './evilscan --target 64.4.11.37 --reverse --json';

        var proc = spawn('node',args.split(' '));
        var linereader = rl.createInterface(proc.stdout, proc.stdin);

        linereader.on('line',function(data) {
            data = data.toString();
            checkString(data);
            var obj = JSON.parse(data);
            checkJson(obj);
            expect(obj.reverse).to.be.equal('00001001.ch');
        });

        proc.on('close',function() {
            next();
        });

        proc.stderr.on('data',function(data) {
            throw new Error(data.toString());
        });

    });

    test('massive reverse on 173.194.40.0/24 should return 253 no empty results',function(next) {
        this.timeout(5000);
        var done = 0;
        var args = './evilscan --target 173.194.40.162/24  --json --reverse --concurrency=5';

        var proc = spawn('node',args.split(' '));
        var linereader = rl.createInterface(proc.stdout, proc.stdin);

        linereader.on('line',function(data) {
            data = data.toString();
            checkString(data);
            var obj = JSON.parse(data);
            checkJson(obj);
            expect(obj.reverse).to.be.a('string');
            expect(obj.reverse.length>0).to.be.equal(true);
            expect(obj.port).to.be.equal(undefined);
            done++;
        });

        proc.on('close',function() {
            expect(done).to.be.equal(253);
            next();
        });

        proc.stderr.on('data',function(data) {
            throw new Error(data.toString());
        });
    });

});
