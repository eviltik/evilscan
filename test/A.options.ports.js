
var expect = require('chai').expect;
var path = require('path');

suite(path.basename(__filename), function() {

    var getPorts = require('../libs/options.js').getPorts;

    test('port: no port specified',function() {
        getPorts(null,function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(0);
        });
    });

    test('port: bad port (--port=xy)',function() {
        getPorts('xy',function(err,r) {
            expect(err).to.match(/invalid port/i);
            expect(r).to.be.equal(undefined);
        });
    });

    test('port: valid single port (--port=21)',function() {
        getPorts('21',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(21);
        });
    });

    test('port: valid port range (--port=21-23)',function() {
        getPorts('21-23',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(3);
            expect(r).to.be.eql([21,22,23]);
        });
    });

    test('port: valid port list (--port=21,22,23)',function() {
        getPorts('21,22,23',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(3);
            expect(r).to.be.eql([21,22,23]);
        });
    });

    test('port: valid port mixed (--port=21-23,80)',function() {
        getPorts('21-23,80',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(4);
            expect(r).to.be.eql([21,22,23,80]);
        });
    });
});

