
import * as cubism from 'cubism';
import * as operators from './operators';
import * as _ from 'lodash';


export interface ICubismConfiguration {
    /**
     * Time between two events - aka "latency" (see cubism.step)
     */
    periodicTime: number;

    /**
     * How much values to show in cubism (see cubism.size)
     */
    size: number;
}


export class MetricInfo {
    Topic: string;
    Stream: Rx.Observable<operators.Metric>;
}

function createMetric(cubsimContext: any, metricInfo: MetricInfo): any {
    
    /**
     * 
     * Big thanks to: https://gist.github.com/cuadue/6427101
     * For the code here, I have modified it to match my scenario.
     * 
     */
    
    var buf = [], callbacks = [];
    var streamer = {
        data: function(ts, val) {
            buf.push({ ts: ts, val: val });
            callbacks = callbacks.reduce(function(result, cb) {
                if (!cb(buf))
                    result.push(cb);
                return result
            }, []);
        },
        add_callback: function(cb) {
            callbacks.push(cb);
        }
    }

    metricInfo.Stream.subscribe(m => {
        streamer.data(m.Time, m.Value);
    });


    return cubsimContext.metric(function(start, stop, step, callback) {
        start = start.getTime();
        stop = stop.getTime();

        streamer.add_callback(function(buf) {
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
            callback(null, r.map(function(ts) {
                if (ts < point.ts) {
                    // We have to drop points if no data is available
                    return null;
                }
                for (; buf[i].ts < ts; i++);
                return buf[i].val;
            }));

            // opaque, but this tells the callback handler to
            // remove this function from its queue
            return true;
        });
    }, metricInfo.Topic);

}



export function
    renderVisualization(configuration: ICubismConfiguration, metricsStreams: MetricInfo[]): void {

    var context = cubism.context()
        .step(configuration.periodicTime)
        .size(configuration.size);

    var metrics: any[] = _.map(metricsStreams, stream => createMetric(context, stream));

    d3.select("body").selectAll(".axis")
        .data(["top", "bottom"])
        .enter().append("div")
        .attr("class", function(d) { return d + " axis"; })
        .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

    d3.select("body").append("div")
        .attr("class", "rule")
        .call(context.rule());

    d3.select("body").selectAll(".horizon")
        .data(metrics)
        .enter().insert("div", ".bottom")
        .attr("class", "horizon")
        .call(context.horizon());

    context.on("focus", function(i) {
        d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
    });

}

