
// Require chai.js should module for assertions
var expect = require('chai').expect;

suite('Command line options (target) #', function() {

    var getTargets = require('../libs/optionsParser.js').getTargets;

    test('no target specified',function() {
        getTargets(null,function(err,r) {
            expect(err).to.match(/--target/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('bad ipv4: --target 327.0.0.10',function() {
        getTargets('327.0.0.10',function(err,r) {
            expect(err).to.match(/not a valid/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('unsupported ipv6: --target 2001:db8:0:85a3:0:0:ac1f:8001',function() {
        getTargets('2001:db8:0:85a3:0:0:ac1f:8001',function(err,r) {
            expect(err).to.match(/not supported/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('valid ipv4: --target 127.0.0.1',function() {
        getTargets('127.0.0.1',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(1);
            expect(r[0]).to.be.equal('127.0.0.1');
        });
    });

    test('invalid ipv4 cidr: --target 127.0.0.1/xy',function() {
        getTargets('127.0.0.1/xy',function(err,r) {
            expect(err).to.match(/nvalid IPv4 CIDR/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('invalid ipv4 cidr: --target 327.0.0.1/24',function() {
        getTargets('327.0.0.1/24',function(err,r) {
            expect(err).to.match(/nvalid IPv4 CIDR/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('valid ipv4 cidr: --target 127.0.0.1/24',function() {
        getTargets('127.0.0.1/24',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(253);
        });
    });

    test('resolve existing host: --target google.com',function() {
        getTargets('google.com',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(1);
        });
    });

    test('resolve unexisting host: --target xxgooglez123.tv',function() {
        getTargets('xxgooglez123tv',function(err,r) {
            expect(err).to.be.a('string');
            expect(err).to.match(/Could not resolve/);
        });
    });
});

