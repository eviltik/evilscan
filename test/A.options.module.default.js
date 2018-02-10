const expect = require('chai').expect;
const path = require('path');
const evilscan = require('../');

suite(path.basename(__filename), () => {

    let option = require('../libs/options');

    let defaultConcurrency = 500;
    let defaultTimeout = 2000;

    let props = {
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
            "ips":[
                "127.0.0.1",
                "127.0.0.2",
                "127.0.0.3",
                "127.0.0.4",
                "127.0.0.5"
            ],
            "ports":[21,22,23,80]
        }
    }


    test(props.title,(next) => {
        let scan = new evilscan(props.args, (err, s) => {
            expect(s.options).to.be.deep.equal(props.result);
            next();
        });
    });

});
