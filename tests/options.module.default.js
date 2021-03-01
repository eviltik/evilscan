const tester = require('tape');
const path = require('path');
const Evilscan = require('../');

const scriptName = path.basename(__filename);

const props = {
    title:scriptName+': all args',
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
        'target':[
            '127.0.0.1/29'
        ],
        'port':'21-23,80',
        'status':'TROU',
        'concurrency':1,
        'timeout':1,
        'json':true,
        'geo':true,
        'reverse':true,
        'showTimeout':true,
        'showRefuse':true,
        'showOpen':true,
        'showUnreachable':true,
        'scan':'tcpconnect',
        'display':'json',
        'ips':[
            '127.0.0.1',
            '127.0.0.2',
            '127.0.0.3',
            '127.0.0.4',
            '127.0.0.5'
        ],
        'ports':[21, 22, 23, 80]
    }
};

tester(props.title, (test) => {
    new Evilscan(props.args, (err, s) => {
        test.deepEqual(s.options, props.result);
        test.end();
    });
});
