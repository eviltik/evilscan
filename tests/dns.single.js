const tester = require('tape');
const spawn = require('child_process').spawn;
const rl = require('readline');
const Evilscan = require('../');
const path = require('path');
const scriptName = path.basename(__filename);

function cleanCmdLineArgs(str) {
    str = str.replace(/.\/bin\/evilscan.js /, ' ').trim();
    str = str.replace(/\-\-/g, '');
    return '['+str+']';
}

const arr = [{
    title:'should return a real result',
    args:'./bin/evilscan.js 198.252.206.140 --reverse --json',
    data:{
        ip:'198.252.206.140',
        reverse:'stackoverflow.com'
    }
}];

function checkResult(test, data, exp) {
    if (typeof data !='object') {
        data = data.toString();
        test.equal(typeof data, 'string', 'should return a string');
        test.equal(data.length>1, true, 'response length should be > 1');
        data = JSON.parse(data);
    }
    test.equal(typeof data, 'object', 'JSON.parse should return an object');
    test.deepEqual(data, exp, 'result object should match');
    return true;
}

// simulate command line

arr.forEach(item => {
    tester(scriptName+':binary: ['+item.args+'] '+item.title, (test) => {

        let checked = false;
        const proc = spawn('node', item.args.split(' '));
        const linereader = rl.createInterface(proc.stdout, proc.stdin);

        linereader.on('line', data => {
            if (item.data) return checked = checkResult(test, data, item.data);
            checked = true;
        });

        proc.on('close', () => {
            test.equal(checked, true, 'line received before close proc');
            test.end();
        });

        proc.stderr.on('data', data => {
            throw new Error(data.toString());
        });

    });
});

// simulate module usage

arr.forEach(function(item) {
    const o = item.args.split(' ');
    const argv = {};
    argv.target = o[1];
    o.forEach(function(arg) {
        if (arg.match(/\-\-/)) {
            arg = arg.replace(/\-\-/, '');
            if (arg.match(/=/)) {
                const v = arg.split('=');
                argv[v[0]]=parseInt(v[1]);
            } else {
                argv[arg] = true;
            }
        }
    });

    tester(
        scriptName+':module: '+cleanCmdLineArgs(item.args)+' '+item.title,
        { timeout: 5000 },
        (test) => {

            let checked = false;

            new Evilscan(argv, (err, s) => {

                s.on('result', data => {
                    test.equal(typeof data.port, 'undefined', 'port should be undefined');
                    test.equal(typeof data.reverse, 'string', 'reverse should be a string');
                    test.equal(data.reverse.length>0, true, 'reverse length should be > 0');
                    if (item.data) {
                        return checked = checkResult(test, data, item.data);
                    }
                    checked = true;
                });

                s.on('error', err => {
                    throw new Error(err);
                });

                s.on('done', () => {
                    test.equal(checked, true, 'line received before close proc');
                    test.end();
                });

                s.run();
            });
        });
});
