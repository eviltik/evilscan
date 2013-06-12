
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

    test('microsoft 64.4.11.37 should return 00001001.ch',function(next) {

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

});
