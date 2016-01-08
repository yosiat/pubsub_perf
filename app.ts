
import * as autobahn from 'autobahn';

console.log("Hello world");


var connectionOptions :autobahn.IConnectionOptions = {
    url: "ws://127.0.0.1:8080/ws",
    realm: "realm1"
};

var connection: autobahn.Connection = new autobahn.Connection(connectionOptions);


connection.onopen = function(session: autobahn.Session) {
    console.log(session);
};

connection.open();



console.log(connection);