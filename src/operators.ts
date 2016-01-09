import * as Rx from 'rx';
import {Message} from './wamp.rx';
import {getBinarySize} from 'utf8-binary-cutter';



export class Metric {
    Topic: string;
    Value: number;
    Time: number;
}


export type metricOperator = (messageStream: Rx.Observable<Message>) => Rx.Observable<Metric>;

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
export function latency(messageStream: Rx.Observable<Message>): Rx.Observable<Metric> {
    return messageStream.timestamp()
        .pairwise()
        .map<Metric>(([first, last]) => {
            return {
                Topic: first.value.Topic,
                Value: last.timestamp - first.timestamp,
                Time: Date.now()
            };
        });
}


export function size(messageStream: Rx.Observable<Message>): Rx.Observable<Metric> {
    return messageStream.timestamp().map<Metric>(message => {
        // TODO: find a better way to calculate the size? maybe "transport"?
        
        return {
            Topic: message.value.Topic,
            Value: getBinarySize(JSON.stringify(message.value.Data)),
            Time: message.timestamp
        };
    });
}