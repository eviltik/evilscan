const expect = require('chai').expect;
const path = require('path');

suite(path.basename(__filename), () => {

    let getTargets = require('../libs/options.js').getTargets;

    test('target: no target specified', () => {
        getTargets(null, (err,r) => {
            expect(err).to.match(/target/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: bad ipv4 327.0.0.10', () => {
        getTargets('327.0.0.10', (err,r) => {
            expect(err).to.match(/not a valid/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: unsupported ipv6 2001:db8:0:85a3:0:0:ac1f:8001', () => {
        getTargets('2001:db8:0:85a3:0:0:ac1f:8001', (err,r) => {
            expect(err).to.match(/not supported/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: valid ipv4 127.0.0.1', () => {
        getTargets('127.0.0.1', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(1);
            expect(r[0]).to.be.equal('127.0.0.1');
        });
    });

    test('target: invalid ipv4 cidr: 127.0.0.1/xy', () => {
        getTargets('127.0.0.1/xy', (err,r) => {
            expect(err).to.match(/nvalid IPv4 CIDR/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: invalid ipv4 cidr 327.0.0.1/24', () => {
        getTargets('327.0.0.1/24', (err,r) => {
            expect(err).to.match(/nvalid IPv4 CIDR/);
            expect(r).to.be.equal(undefined);
        });
    });

    test('target: valid ipv4 cidr: 127.0.0.1/24', () => {
        getTargets('127.0.0.1/24', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(253);
        });
    });

    test('target: resolve existing host google.com', () => {
        getTargets('google.com', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(1);
        });
    });

    test('target: resolve unexisting host: xxgooglez123.tv', () => {
        getTargets('xxgooglez123tv', (err,r) => {
            expect(err).to.be.a('string');
            expect(err).to.match(/Could not resolve/);
        });
    });
});
