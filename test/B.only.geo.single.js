
var expect = require('chai').expect;
var net = require('net')
var spawn = require('child_process').spawn;
var rl = require('readline');
var evilscan = require('../main.js');
var path = require('path');

var cleanCmdLineArgs = function(str) {
    str = str.replace(/.\/bin\/evilscan.js /,' ').trim();
    str = str.replace(/\-\-/g,'');
    return '['+str+']';
}

suite(path.basename(__filename), function() {

    var checkResult = function(data,exp) {
        if (typeof data !='object') {
            data = data.toString();
            expect(data,'response type should be a string').to.be.a('string');
            expect(data.length > 1,'response length should be >1').to.be.ok;
            data = JSON.parse(data);
        }
        expect(data,'JSON.parse should return an object').to.be.a('object');
        expect(data,'object should match').to.be.deep.equal(exp);
        return true;
    }

    var arr = [{
        title:'should return a real result',
        args:'./bin/evilscan.js 173.194.45.67 --geo --json',
        data: {
            ip: '173.194.45.67',
            city: 'Mountain View',
            country: 'US',
            region: 'CA',
            latitude: 37.4192,
            longitude: -122.0574
        }
    }]

    /* simulate command line */

    arr.forEach(function(item) {
        test('Binary: ['+item.args+'] '+item.title,function(next) {

            var checked = false;
            var proc = spawn('node',item.args.split(' '));
            var linereader = rl.createInterface(proc.stdout, proc.stdin);

            linereader.on('line',function(data) {
                if (item.data) return checked = checkResult(data,item.data);
                checked = true;
            });

            proc.on('close',function() {
                expect(checked,'line received before close proc').to.be.ok;
                next();
            });

            proc.stderr.on('data',function(data) {
                throw new Error(data.toString());
            });

        });
    });

    /* simulate module usage */

    arr.forEach(function(item) {
        var o = item.args.split(' ');
        var argv = {};
        argv.target = o[1];
        o.forEach(function(arg) {
            if (arg.match(/\-\-/)) {
                arg = arg.replace(/\-\-/,'');
                argv[arg] = true;
            }
        });

        test('Module: '+cleanCmdLineArgs(item.args)+' '+item.title,function(next) {

            var checked = false;

            var scan = new evilscan(argv,function(s) {

                s.on('result',function(data) {
                    if (item.data) return checked = checkResult(data,item.data);
                    checked = true;
                });

                s.on('error',function(err) {
                    throw new Error(data.toString());
                });

                s.on('done',function() {
                    expect(checked,'line received before close proc').to.be.ok;
                    next();
                });

                s.run();
            });
        });
    });
});
