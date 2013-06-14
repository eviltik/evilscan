var argv = require('optimist').argv;

var outputJson = function(o) {
    console.log(JSON.stringify(o));
}

var outputRaw = function(o) {
    if (o.error) {
        return console.log('Error: ',o.error)
    }
    var str = '';
    for (var key in o) str+=o[key]+'|';
    str = str.replace(/\| ?$/,'');
    console.log(str);
}

var output = function(o,argv) {
    if (argv.json) {
        return outputJson(o);
    }
    return outputRaw(o);
}

module.exports = output;