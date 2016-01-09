
import * as autobahn from 'autobahn';
import * as Rx from 'rx';


export class Message {
    Topic: string;
    Data: any;
}


export function subscribeToTopic(session: autobahn.Session, topic: string): Rx.Observable<Message> {
    return Rx.Observable.create((observer: Rx.Observer<Message>) => {
        /**
         * Save the subscription on this scope for dispose method
         */
        var currentSubscription: autobahn.ISubscription = null;
        
        /**
         * This is for handling the fast case - dispose is called before "onSubscriptionCreated"
         */
        var isDisposed: boolean = false;


        function onDataArrived(args) {
            var message: Message = {
                Topic: topic,
                Data: args
            };
            observer.onNext(message);
        }

        function onSubscriptionCreated(subscription: autobahn.ISubscription) {
            if (isDisposed) {
                subscription.unsubscribe();
                return;
            }

            currentSubscription = subscription;
        }

        function onError(error) {
            observer.onError(error);
        }


        session
            .subscribe(topic, onDataArrived)
            .then(onSubscriptionCreated, onError);

        return () => {
            isDisposed = true;
            if (currentSubscription !== null) {
                currentSubscription.unsubscribe();
            }
        };
    }).share();
}

