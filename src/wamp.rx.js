var Rx = require('rx');
var Message = (function () {
    function Message() {
    }
    return Message;
})();
exports.Message = Message;
function subscribeToTopic(session, topic) {
    return Rx.Observable.create(function (observer) {
        /**
         * Save the subscription on this scope for dispose method
         */
        var currentSubscription = null;
        /**
         * This is for handling the fast case - dispose is called before "onSubscriptionCreated"
         */
        var isDisposed = false;
        function onDataArrived(args) {
            var message = {
                Topic: topic,
                Data: args
            };
            observer.onNext(message);
        }
        function onSubscriptionCreated(subscription) {
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
        return function () {
            isDisposed = true;
            if (currentSubscription !== null) {
                currentSubscription.unsubscribe();
            }
        };
    }).share();
}
exports.subscribeToTopic = subscribeToTopic;
