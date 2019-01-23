
const expect = require('chai').expect;
const net = require('net')
const spawn = require('child_process').spawn;
const rl = require('readline');
const evilscan = require('../');
const path = require('path');

function cleanCmdLineArgs(str) {
    str = str.replace(/.\/bin\/evilscan.js /,' ').trim();
    str = str.replace(/\-\-/g,'');
    return '['+str+']';
}

suite(path.basename(__filename), () => {

    const checkResult = (data,exp) => {
        if (typeof data !='object') {
            data = data.toString();
            expect(data,'response type should be a string').to.be.a('string');
            expect(data.length > 1,'response length should be >1').to.be.ok;
            data = JSON.parse(data);
        }
        expect(data,'JSON.parse should return an object').to.be.a('object');
        console.log('received', data);
        console.log('expected', exp);
        expect(data,'object should match').to.be.deep.equal(exp);
        return true;
    }

    let arr = [{
        title:'should return a real result',
        args:'./bin/evilscan.js 173.194.45.67 --geo --json',
        data: {
            ip: '173.194.45.67',
            city: 'Mountain View',
            country: 'US',
            region: 'NA',
            latitude: 37.4192,
            longitude: -122.0574
        }
    }]

    /* simulate command line */

    arr.forEach((item) => {
        test('Binary: ['+item.args+'] '+item.title, next => {

            let checked = false;
            let proc = spawn('node',item.args.split(' '));
            let linereader = rl.createInterface(proc.stdout, proc.stdin);

            linereader.on('line', data => {
                if (item.data) return checked = checkResult(data,item.data);
                checked = true;
            });

            proc.on('close', () => {
                expect(checked,'line received before close proc').to.be.ok;
                next();
            });

            proc.stderr.on('data', data => {
                throw new Error(data.toString());
            });

        });
    });

    /* simulate module usage */

    arr.forEach(item => {
        let o = item.args.split(' ');
        let argv = {};
        argv.target = o[1];
        o.forEach(function(arg) {
            if (arg.match(/\-\-/)) {
                arg = arg.replace(/\-\-/,'');
                argv[arg] = true;
            }
        });

        test('Module: '+cleanCmdLineArgs(item.args)+' '+item.title, function(next) {

            let checked = false;

            new evilscan(argv, (err, s) => {

                s.on('result', data => {
                    if (item.data) return checked = checkResult(data, item.data);
                    checked = true;
                });

                s.on('error', err => {throw new Error(data.toString())});

                s.on('done',() => {
                    expect(checked,'line received before close proc').to.be.ok;
                    next();
                });

                s.run();
            });
        });
    });
});
