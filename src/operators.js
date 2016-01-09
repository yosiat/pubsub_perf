var utf8_binary_cutter_1 = require('utf8-binary-cutter');
var Metric = (function () {
    function Metric() {
    }
    return Metric;
})();
exports.Metric = Metric;
/**
 * Given a message returns a stream of Metric's, where the value is latency in ms.
 *
 * Latency is calculated by taking two pair of events (sequentially), and return the
 * delta of publish time.
 *
 * This metric is good for periodic publishes, for example sending data every 10seconds,
 * and we want to make sure we are actucally getting the data every 10 seconds, hence we want
 * to check the latency and make is sure 10,000 (10seconds in ms).
 */
function latency(messageStream) {
    return messageStream.timestamp()
        .pairwise()
        .map(function (_a) {
        var first = _a[0], last = _a[1];
        return {
            Topic: first.value.Topic,
            Value: last.timestamp - first.timestamp,
            Time: Date.now()
        };
    });
}
exports.latency = latency;
function size(messageStream) {
    return messageStream.timestamp().map(function (message) {
        // TODO: find a better way to calculate the size? maybe "transport"?
        return {
            Topic: message.value.Topic,
            Value: utf8_binary_cutter_1.getBinarySize(JSON.stringify(message.value.Data)),
            Time: message.timestamp
        };
    });
}
exports.size = size;
