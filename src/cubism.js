var cubism = require('cubism');
var _ = require('lodash');
var metricsCount = 0;
var MetricInfo = (function () {
    function MetricInfo() {
    }
    return MetricInfo;
})();
function createMetric(cubsimContext, metricInfo) {
    var buf = [], callbacks = [];
    var streamer = {
        data: function (ts, val) {
            buf.push({ ts: ts, val: val });
            callbacks = callbacks.reduce(function (result, cb) {
                if (!cb(buf))
                    result.push(cb);
                return result;
            }, []);
        },
        add_callback: function (cb) {
            callbacks.push(cb);
        }
    };
    metricInfo.Stream.subscribe(function (m) {
        streamer.data(m.Time, m.Value);
    });
    return cubsimContext.metric(function (start, stop, step, callback) {
        start = start.getTime();
        stop = stop.getTime();
        streamer.add_callback(function (buf) {
            if (!(buf.length > 1 &&
                buf[buf.length - 1].ts > stop + step)) {
                // Not ready, wait for more data
                return false;
            }
            var r = d3.range(start, stop, step);
            /* Don't like using a linear search here, but I don't
             * know enough about cubism to really optimize. I had
             * assumed that once a timestamp was requested, it would
             * never be needed again so I could drop it. That doesn't
             * seem to be true!
             */
            var i = 0;
            var point = buf[i];
            callback(null, r.map(function (ts) {
                if (ts < point.ts) {
                    // We have to drop points if no data is available
                    return null;
                }
                for (; buf[i].ts < ts; i++)
                    ;
                return buf[i].val;
            }));
            // opaque, but this tells the callback handler to
            // remove this function from its queue
            return true;
        });
    }, metricInfo.Topic);
}
function createMetricOld(cubsimContext, metricStream) {
    var value = 0, values = [], i = 0, last;
    var x = 1;
    var metricValues = [];
    metricStream.Stream.subscribe(function (m) {
        metricValues.push(m);
    });
    return cubsimContext.metric(function (start, stop, step, callback) {
        if (metricValues.length == 0) {
            callback(null, []);
            return;
        }
        var startTime = start.getTime(), stopTime = stop.getTime();
        var nextMetrics = _.filter(metricValues, function (m) { return m.Time < stopTime; });
        var beforeClean = metricValues.length;
        metricValues = _.reject(metricValues, function (m) { return m.Time < startTime; });
        console.log(nextMetrics.length, beforeClean, metricValues.length);
        callback(null, _.map(nextMetrics, function (m) { return m.Value; }));
        // var isAllMatch = _.all(metricValues, nextValue => nextValue.Time > start && stop < nextValue.Time);
        // var matchCount = _.filter(metricValues, nextValue => nextValue.Time > start && stop < nextValue.Time).length;
        // console.log("Length: " + metricValues.length, "All match? " + isAllMatch, "Match count:" + matchCount);
        // console.log(nextValue.Time > + start, +stop < nextValue.Time);
        // callback(null, [nextValue.Value]);
        // var values = [];
        // // convert start & stop to milliseconds
        // start = +start;
        // stop = +stop;
        // while (start < stop) {
        // start += step;
        // values.push(Math.random());
        // }
        // callback(null, values);
    }, metricStream.Topic);
}
function renderVisualizationFriend(configuration, metricsStreams) {
    console.info("Hello Periodic time:" + configuration.periodicTime + ", Size:" + configuration.size);
    var context = cubism.context()
        .step(configuration.periodicTime)
        .size(configuration.size);
    var metrics = _.map(metricsStreams, function (stream) { return createMetric(context, stream); });
    ['top', 'bottom'].map(function (d) {
        d3.select('#charts').append('div')
            .attr('class', d + ' axis')
            .call(context.axis().ticks(12).orient(d));
    });
    d3.select('#charts').append('div').attr('class', 'rule')
        .call(context.rule());
    _.each(metricsStreams, function (metricInfo) {
        d3.select('#charts')
            .insert('div', '.bottom')
            .datum(createMetric(context, metricInfo))
            .attr('class', 'horizon')
            .call(context.horizon()
            .extent([0, 1000])
            .title(metricInfo.Topic)
            .format(_.identity));
    });
}
exports.renderVisualizationFriend = renderVisualizationFriend;
function renderVisualization(configuration, metricsStreams) {
    console.info("Yosi Periodic time:" + configuration.periodicTime + ", Size:" + configuration.size);
    var context = cubism.context()
        .step(configuration.periodicTime)
        .size(configuration.size);
    var metrics = _.map(metricsStreams, function (stream) { return createMetric(context, stream); });
    d3.select("body").selectAll(".axis")
        .data(["top", "bottom"])
        .enter().append("div")
        .attr("class", function (d) { return d + " axis"; })
        .each(function (d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });
    d3.select("body").append("div")
        .attr("class", "rule")
        .call(context.rule());
    d3.select("body").selectAll(".horizon")
        .data(metrics)
        .enter().insert("div", ".bottom")
        .attr("class", "horizon")
        .call(context.horizon());
    context.on("focus", function (i) {
        d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
    });
}
exports.renderVisualization = renderVisualization;
