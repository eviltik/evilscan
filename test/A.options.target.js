
// Require chai.js should module for assertions
var expect = require('chai').expect;
var path = require('path');

suite(path.basename(__filename), function() {

    var getTargets = require('../libs/options.js').getTargets;

    test('target: no target specified',function() {
        getTargets(null,function(err,r) {
            expect(err).to.match(/target/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: bad ipv4 327.0.0.10',function() {
        getTargets('327.0.0.10',function(err,r) {
            expect(err).to.match(/not a valid/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: unsupported ipv6 2001:db8:0:85a3:0:0:ac1f:8001',function() {
        getTargets('2001:db8:0:85a3:0:0:ac1f:8001',function(err,r) {
            expect(err).to.match(/not supported/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: valid ipv4 127.0.0.1',function() {
        getTargets('127.0.0.1',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(1);
            expect(r[0]).to.be.equal('127.0.0.1');
        });
    });

    test('target: invalid ipv4 cidr: 127.0.0.1/xy',function() {
        getTargets('127.0.0.1/xy',function(err,r) {
            expect(err).to.match(/nvalid IPv4 CIDR/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: invalid ipv4 cidr 327.0.0.1/24',function() {
        getTargets('327.0.0.1/24',function(err,r) {
            expect(err).to.match(/nvalid IPv4 CIDR/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: valid ipv4 cidr: 127.0.0.1/24',function() {
        getTargets('127.0.0.1/24',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(253);
        });
    });

    test('target: resolve existing host google.com',function() {
        getTargets('google.com',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(1);
        });
    });

    test('target: resolve unexisting host: xxgooglez123.tv',function() {
        getTargets('xxgooglez123tv',function(err,r) {
            expect(err).to.be.a('string');
            expect(err).to.match(/Could not resolve/);
        });
    });
});

