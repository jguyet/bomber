/**
 * Created by Liza on 05.07.2015.
 */

function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

function EventEmitter() {
    this._events = this._events || {};
    this._maxListeners = this._maxListeners || 10;
}

EventEmitter.prototype.emit = function (type) {
    var er, handler, len, args, i, listeners;

    if (!this._events)
        this._events = {};

    // If there is no 'error' event listener then throw.
    if (type === 'error') {
        if (!this._events.error ||
            (typeof this._events.error === 'object' && !this._events.error.length)) {
            er = arguments[1];

            if (er instanceof Error) {
                throw er; // Unhandled 'error' event
            } else {
                throw TypeError('Uncaught, unspecified "error" event.');
            }
            return false;
        }
    }

    handler = this._events[type];

    if (typeof handler === 'undefined')
        return false;

    if (typeof handler === 'function') {
        switch (arguments.length) {
            // fast cases
            case 1:
                handler.call(this);
                break;
            case 2:
                handler.call(this, arguments[1]);
                break;
            case 3:
                handler.call(this, arguments[1], arguments[2]);
                break;
            // slower
            default:
                len = arguments.length;
                args = new Array(len - 1);
                for (i = 1; i < len; i++)
                    args[i - 1] = arguments[i];
                handler.apply(this, args);
        }
    } else if (typeof handler === 'object') {
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];

        listeners = handler.slice();
        len = listeners.length;
        for (i = 0; i < len; i++)
            listeners[i].apply(this, args);
    }

    return true;
};

EventEmitter.prototype.on = function (type, listener) {
    var m;

    if (typeof listener !== 'function')
        throw TypeError('listener must be a function');

    if (!this._events)
        this._events = {};

    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (this._events.newListener)
        this.emit('newListener', type, typeof listener.listener === 'function' ?
            listener.listener : listener);

    if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
        this._events[type] = listener;
    else if (typeof this._events[type] === 'object')
    // If we've already got an array, just append.
        this._events[type].push(listener);
    else
    // Adding the second element, need to change to array.
        this._events[type] = [this._events[type], listener];

    // Check for listener leak
    if (typeof this._events[type] === 'object' && !this._events[type].warned) {
        m = this._maxListeners;
        if (m && m > 0 && this._events[type].length > m) {
            this._events[type].warned = true;
            console.error('(node) warning: possible EventEmitter memory ' +
                'leak detected. %d listeners added. ' +
                'Use emitter.setMaxListeners() to increase limit.',
                this._events[type].length);
            console.trace();
        }
    }

    return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function (type, listener) {
    var list, position, length, i;

    if (typeof listener !== 'function')
        throw TypeError('listener must be a function');

    if (!this._events || !this._events[type])
        return this;

    list = this._events[type];
    length = list.length;
    position = -1;

    if (list === listener ||
        (typeof list.listener === 'function' && list.listener === listener)) {
        delete this._events[type];
        if (this._events.removeListener)
            this.emit('removeListener', type, listener);

    } else if (typeof list === 'object') {
        for (i = length; i-- > 0;) {
            if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
                position = i;
                break;
            }
        }

        if (position < 0)
            return this;

        if (list.length === 1) {
            list.length = 0;
            delete this._events[type];
        } else {
            list.splice(position, 1);
        }

        if (this._events.removeListener)
            this.emit('removeListener', type, listener);
    }

    return this;
};