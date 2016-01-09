
import * as autobahn from 'autobahn';
import * as _ from 'lodash';

import * as Rx from 'rx';
import {subscribeToTopic} from './src/wamp.rx';
import * as operators from './src/operators';
import * as visualization from './src/cubism';



var connectionOptions: autobahn.IConnectionOptions = {
    url: "ws://127.0.0.1:8080/ws",
    realm: "realm1"
};

var connection: autobahn.Connection = new autobahn.Connection(connectionOptions);
connection.onopen = function(session: autobahn.Session) {

    var metrics = [];
    
    _.range(0, 40).forEach(function(n) {
        metrics.push({
            Topic: 'OnCounter ' + n + ' (Latency)',
            Stream: operators.latency(subscribeToTopic(session, 'com.example.oncounter'+n))
        });
    });

    visualization.renderVisualization({
        periodicTime: 1000,
        size: 1280
    }, metrics);
    

};

connection.open();

