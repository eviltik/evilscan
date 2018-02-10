const evilscan = require('../');

let options = {
    target :'173.194.45.67',
    // target  :'192.168.1.1-5',
    // target  :'192.168.1.1-192.168.1.5',
    port    :'21, 22, 23, 80, 443, 4443, 4444, 5038, 5060-5070, 8080',
    status  : 'TROU', // Timeout, Refused, Open, Unreachable
    timeout : 3000,
    banner  : true,
    //geo	    : true
};

let scanner = new evilscan(options);

scanner.on('result',function (data) {
	// fired when item is matching options
	console.log(data);
});

scanner.on('error',function (err) {
	throw new Error(data.toString());
});

scanner.on('done',function () {
	// finished !
});

scanner.run();
