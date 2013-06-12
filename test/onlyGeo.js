
var expect = require('chai').expect;
var net = require('net')
var spawn = require('child_process').spawn;
var rl = require('readline');

suite('Geoip info only #', function(a) {

    var checkString = function(data) {
        expect(data).to.be.a('string');
    }

    var checkJson = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('ip');
    }

    test('173.194.45.67 should have city/country/lat/long',function(next) {

        var args = './evilscan --target 173.194.45.67 --geo --json';

        var proc = spawn('node',args.split(' '));
        var linereader = rl.createInterface(proc.stdout, proc.stdin);

        linereader.on('line',function(data) {
            data = data.toString();
            checkString(data);
            var obj = JSON.parse(data);
            checkJson(obj);
            expect(obj.ip).to.be.equal('173.194.45.67');
            expect(obj.city).to.be.equal('Mountain View');
            expect(obj.country).to.be.equal('United States');
            expect(obj.latitude).to.be.equal(37.4192008972168);
            expect(obj.longitude).to.be.equal(-122.05740356445312);
        });

        proc.on('close',function() {
            next();
        });

        proc.stderr.on('data',function(data) {
            throw new Error(data.toString());
        });

    });

    test('65.55.57.27 should have city/country/lat/long',function(next) {

        var args = './evilscan --target 65.55.57.27 --geo --json';

        var proc = spawn('node',args.split(' '));
        var linereader = rl.createInterface(proc.stdout,proc.stdin);

        linereader.on('line',function(data) {
            data = data.toString();
            checkString(data);
            var obj = JSON.parse(data);
            checkJson(obj);
            expect(obj.ip).to.be.equal('65.55.57.27');
            expect(obj.city).to.be.equal('Redmond');
            expect(obj.country).to.be.equal('United States');
            expect(obj.latitude).to.be.equal(47.68009948730469);
            expect(obj.longitude).to.be.equal(-122.12059783935547);
        });

        proc.on('close',function() {
            next();
        });

        proc.stderr.on('data',function(data) {
            throw new Error(data.toString());
        });

    });
});
