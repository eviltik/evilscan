const expect = require('chai').expect;
const path = require('path');

suite(path.basename(__filename), () => {

    let getPorts = require('../libs/options.js').getPorts;

    test('port: no port specified', () => {
        getPorts(null, (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(0);
        });
    });

    test('port: bad port (--port=xy)', () => {
        getPorts('xy', (err,r) => {
            expect(err).to.match(/invalid port/i);
            expect(r).to.be.equal(undefined);
        });
    });

    test('port: valid single port (--port=21)', () => {
        getPorts('21', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(21);
        });
    });

    test('port: valid port range (--port=21-23)', () => {
        getPorts('21-23', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(3);
            expect(r).to.be.eql([21,22,23]);
        });
    });

    test('port: valid port list (--port=21,22,23)', () => {
        getPorts('21,22,23', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(3);
            expect(r).to.be.eql([21,22,23]);
        });
    });

    test('port: valid port mixed (--port=21-23,80)', () => {
        getPorts('21-23,80', (err,r) => {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(4);
            expect(r).to.be.eql([21,22,23,80]);
        });
    });
});
