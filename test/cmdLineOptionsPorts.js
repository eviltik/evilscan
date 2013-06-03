
var expect = require('chai').expect;

suite('Command line options (port) #', function() {

    var getPorts = require('../libs/optionsParser.js').getPorts;

    var commonCheck = function(r) {
        expect(r).to.be.a('object');
        expect(r).to.have.property('error');
    }

    test('no port specified',function() {
        var r = getPorts();
        commonCheck(r);
        expect(r.error).to.match(/--port/);
    });

    test('bad port (--port=xy)',function() {
        var r = getPorts('xy');
        commonCheck(r);
        expect(r.error).to.match(/invalid port/i);
    });

    test('single string port (--port=21)',function() {
        var r = getPorts('21');
        expect(r).to.be.a('array');
        expect(r[0]).to.be.equal(21);
    });

    test('single int port (--port=21)',function() {
        var r = getPorts(21);
        expect(r).to.be.a('array');
        expect(r[0]).to.be.equal(21);
    });

    test('port range (--port=21-23)',function() {
        var r = getPorts('21-23');
        expect(r).to.be.a('array');
        expect(r.length).to.be.equal(3);
        expect(r).to.be.eql([21,22,23]);
    });

    test('port list (--port=21,22,23)',function() {
        var r = getPorts('21,22,23');
        expect(r).to.be.a('array');
        expect(r.length).to.be.equal(3);
        expect(r).to.be.eql([21,22,23]);
    });

    test('port mixed (--port=21-23,80)',function() {
        var r = getPorts('21-23,80');
        expect(r).to.be.a('array');
        expect(r.length).to.be.equal(4);
        expect(r).to.be.eql([21,22,23,80]);
    });
});

