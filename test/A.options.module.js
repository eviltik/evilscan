
var expect = require('chai').expect;
var path = require('path');
var evilscan = require('../main');

suite(path.basename(__filename), function() {

    var option = require('../libs/options');

    var defaultConcurrency = 500;
    var defaultTimeout = 2000;

    var list = [{
        title:'default args',
        args:{
            target:'127.0.0.1'
        },
        result:{
            "_":[],
            "target":"127.0.0.1",
            "concurrency":500,
            "timeout":2000,
            "status":"O",
            "showOpen":true,
            "scan":"tcpconnect",
            "display":"console",
            "console":true,
            "ips":["127.0.0.1"],
            "ports":[0]
        }
    },{
        title:'all args',
        args:{
            target:'127.0.0.1/29',
            port:'21-23,80',
            status:'TROU',
            concurrency:1,
            timeout:1,
            json:true,
            geo:true,
            reverse:true
        },
        result:{
            "_":[],
            "target":"127.0.0.1/29",
            "port":'21-23,80',
            "status":"TROU",
            "concurrency":1,
            "timeout":1,
            "json":true,
            "geo":true,
            "reverse":true,
            "showTimeout":true,
            "showRefuse":true,
            "showOpen":true,
            "showUnreachable":true,
            "scan":"tcpconnect",
            "display":"json",
            //note that console:true vanish rather than false ..
            "ips":[
                "127.0.0.1",
                "127.0.0.2",
                "127.0.0.3",
                "127.0.0.4",
                "127.0.0.5"
            ],
            "ports":[21,22,23,80]
        }
    }];

    while (list.length) {
        var l = list.shift();
        test(l.title,function(next) {
            var scan = new evilscan(l.args,function(s) {
                expect(s.options).to.be.deep.equal(l.result);
                next();
            });
        });
    }

});

