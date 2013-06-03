
// Require chai.js should module for assertions
var expect = require('chai').expect;

suite('Command line options (target) #', function() {

    var getTargets = require('../libs/optionsParser.js').getTargets;

    var commonCheck = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('error');
    }

    test('no target specified',function() {
        var r = getTargets();
        commonCheck(r);
        expect(r.error).to.match(/--target/);
    });

    test('bad ipv4: --target 327.0.0.10',function() {
        var r = getTargets('327.0.0.10');
        commonCheck(r);
        expect(r.error).to.match(/not a valid/);
    });

    test('unsupported ipv6: --target 2001:db8:0:85a3:0:0:ac1f:8001',function() {
        var r = getTargets('2001:db8:0:85a3:0:0:ac1f:8001');
        commonCheck(r);
        expect(r.error).to.match(/not supported/);
    });

    test('valid ipv4: --target 127.0.0.1',function() {
        var r = getTargets('127.0.0.1');
        expect(r).to.be.a('array');
        expect(r.length).to.be.equal(1);
        expect(r[0]).to.be.equal('127.0.0.1');
    });

    test('invalid ipv4 cidr: --target 127.0.0.1/xy',function() {
        var r = getTargets('127.0.0.1/xy');
        commonCheck(r);
        expect(r.error).to.match(/nvalid IPv4 CIDR/);
    });

    test('invalid ipv4 cidr: --target 327.0.0.1/24',function() {
        var r = getTargets('327.0.0.1/24');
        commonCheck(r);
        expect(r.error).to.match(/nvalid IPv4 CIDR/);
    });

    test('valid ipv4 cidr: --target 127.0.0.1/24',function() {
        var r = getTargets('127.0.0.1/24');
        expect(r).to.be.a('array');
        expect(r.length).to.be.equal(253);
    });

});

