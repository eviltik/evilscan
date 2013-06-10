
var expect = require('chai').expect;

suite('Command line options (port) #', function() {

    var getPorts = require('../libs/optionsParser.js').getPorts;

    test('no port specified',function() {
        getPorts(null,function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(0);
        });
    });

    test('bad port (--port=xy)',function() {
        getPorts('xy',function(err,r) {
            expect(err).to.match(/invalid port/i);
            expect(r).to.be.equal(undefined);
        });
    });

    test('single string port (--port=21)',function() {
        getPorts('21',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(21);
        });
    });

    test('single int port (--port=21)',function() {
        getPorts(21,function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r[0]).to.be.equal(21);
        });
    });

    test('port range (--port=21-23)',function() {
        getPorts('21-23',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(3);
            expect(r).to.be.eql([21,22,23]);
        });
    });

    test('port list (--port=21,22,23)',function() {
        getPorts('21,22,23',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(3);
            expect(r).to.be.eql([21,22,23]);
        });
    });

    test('port mixed (--port=21-23,80)',function() {
        getPorts('21-23,80',function(err,r) {
            expect(err).to.be.equal(null);
            expect(r).to.be.a('array');
            expect(r.length).to.be.equal(4);
            expect(r).to.be.eql([21,22,23,80]);
        });
    });
});

