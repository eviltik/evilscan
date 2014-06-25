// var evilscan = require('evilscan');
var evilscan = require('../');

var options = {
    target :'173.194.34.209',
    port   :'80',
    status : 'TROU', // Timeout, Refused, Open, Unreachable
    banner : true,
    geo	   : true
};

var scanner = new evilscan(options);

scanner.on('result',function(data) {
	// fired when item is matching options
	console.log(data);
});

scanner.on('error',function(err) {
	throw new Error(data.toString());
});

scanner.on('done',function() {
	// finished !
});

scanner.run();