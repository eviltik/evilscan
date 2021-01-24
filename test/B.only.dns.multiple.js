const expect = require('chai').expect;
const spawn = require('child_process').spawn;
const rl = require('readline');
const evilscan = require('../');
const path = require('path');

function cleanCmdLineArgs(str) {
    str = str.replace(/.\/bin\/evilscan.js /, ' ').trim();
    str = str.replace(/\-\-/g, '');
    return '['+str+']';
}

suite(path.basename(__filename), () => {

    const checkResult = (data/*, exp*/) => {
        if (typeof data !='object') {
            data = data.toString();
            expect(data, 'response type should be a string').to.be.a('string');
            expect(data.length > 1, 'response length should be >1').to.be.ok;
            data = JSON.parse(data);
        }
        expect(data, 'JSON.parse should return an object').to.be.a('object');
        return true;
    };

    const arr = [{
        title:'should return many dns results',
        args:'./bin/evilscan.js 216.58.208.227/29 --json --reverse'
    }];

    /* simulate command line */

    arr.forEach(item => {
        test('Binary: ['+item.args+'] '+item.title, next => {

            let checked = false;
            const proc = spawn('node', item.args.split(' '));
            const linereader = rl.createInterface(proc.stdout, proc.stdin);

            linereader.on('line', data => {
                checkResult(data);
                data = JSON.parse(data);
                expect(data.port).to.be.a('undefined');
                expect(data.reverse).to.be.a('string');
                expect(data.reverse.length>0).to.be.ok;
                checked = true;
            });

            proc.on('close', () => {
                expect(checked, 'line received before close proc').to.be.ok;
                next();
            });

            proc.stderr.on('data', data => {
                throw new Error(data.toString());
            });

        });
    });

    /* simulate module usage */

    arr.forEach((item) => {
        const o = item.args.split(' ');
        const argv = {};
        argv.target = o[1];
        o.forEach((arg) => {
            if (arg.match(/\-\-/)) {
                arg = arg.replace(/\-\-/, '');
                argv[arg] = true;
            }
        });

        test('Module: '+cleanCmdLineArgs(item.args)+' '+item.title, function(next) {

            this.timeout(5000);
            let checked = false;

            new evilscan(argv, (err, s) => {

                //console.log(s.options);

                s.on('result', data => {
                    expect(data.port).to.be.a('undefined');
                    expect(data.reverse).to.be.a('string');
                    expect(data.reverse.length>0).to.be.ok;
                    checked = true;
                });

                s.on('error', err => {
                    throw new Error(err);
                });

                s.on('done', () => {
                    expect(checked, 'line received before close proc').to.be.ok;
                    next();
                });

                s.run();
            });
        });
    });
});
