const winston = require('winston');

winston.cli();

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize:true,
            timestamp:() => {
                const d = new Date();
                const h = (d.getHours()<10 ? '0' : '')+d.getHours();
                const m = (d.getMinutes()<10 ? '0' : '')+d.getMinutes();
                const s = (d.getSeconds()<10 ? '0' : '')+d.getSeconds();
                let mm = d.getMilliseconds();
                if (mm<10) mm='0'+mm;
                if (mm<100) mm='0'+mm;
                const str = h+':'+m+':'+s+'.'+mm;
                return str;
            }
        })
    ]
});

let debug = false;

process.argv.forEach(arg => {
    if (arg=='-d') debug = true;
});

if (!debug) {
    logger.debug = () => {};
}

module.exports = {
    log:logger
};

