var autobahn = require('autobahn');
var _ = require('lodash');
var wamp_rx_1 = require('./src/wamp.rx');
var operators = require('./src/operators');
var visualization = require('./src/cubism');
var connectionOptions = {
    url: "ws://127.0.0.1:8080/ws",
    realm: "realm1"
};
var connection = new autobahn.Connection(connectionOptions);
console.log("Version:" + 20);
connection.onopen = function (session) {
    var metrics = [];
    _.range(0, 40).forEach(function (n) {
        metrics.push({
            Topic: 'OnCounter ' + n + ' (Latency)',
            Stream: operators.latency(wamp_rx_1.subscribeToTopic(session, 'com.example.oncounter' + n))
        });
    });
    visualization.renderVisualization({
        periodicTime: 1000,
        size: 1280
    }, metrics);
    //         var context = cubism.context().step(1000).size(960);
};
connection.open();
