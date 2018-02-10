const argv = require('minimist2')(process.argv.slice(2));

function outputJson(o) {
    console.log(JSON.stringify(o));
}

function outputRaw(o) {
    if (o.error) {
        return console.log('Error: ',o.error)
    }
    var str = '';
    for (var key in o) str+=o[key]+'|';
    str = str.replace(/\| ?$/,'');
    console.log(str);
}

function output(o,argv) {
    if (argv.json) {
        return outputJson(o);
    }
    return outputRaw(o);
}

module.exports = output;
