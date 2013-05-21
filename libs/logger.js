var winston = require('winston');
winston.cli();


var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			colorize:true,
			timestamp:function() { 
				var d = new Date();
				var h = (d.getHours()<10 ? "0" : "")+d.getHours();
				var m = (d.getMinutes()<10 ? "0" : "")+d.getMinutes();
				var s = (d.getSeconds()<10 ? "0" : "")+d.getSeconds();
				var mm = d.getMilliseconds();
				if (mm<10) mm='0'+mm;
				if (mm<100) mm='0'+mm;
				var str = h+':'+m+':'+s+'.'+mm;
				return str;
			}
		})
	]
});


var i = 0;
var debug = false;

process.argv.forEach(function(arg) {
    if (arg=='-d') debug = true;
    i++;
});

if (!debug) {
	logger.debug = function() {};
}

var fatalError = function(msg) {
    logger.error(msg.replace(/\n$/,''));
    logger.error('Aborting');	
    process.exit();
}


module.exports = {
    log:logger,
    fatalError:fatalError
}

