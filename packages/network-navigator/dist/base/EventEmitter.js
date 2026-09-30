"use strict";
/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A mixin that adds support for event emitting
 */
class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    /**
     * Adds an event listener for the given event
     */
    on(name, handler) {
        const listeners = (this.listeners[name] = this.listeners[name] || []);
        listeners.push(handler);
        return {
            destroy: () => {
                this.off(name, handler);
            },
        };
    }
    /**
     * Removes an event listener for the given event
     */
    off(name, handler) {
        const listeners = this.listeners[name];
        if (listeners) {
            const idx = listeners.indexOf(handler);
            if (idx >= 0) {
                listeners.splice(idx, 1);
            }
        }
    }
    /**
     * Raises the given event
     */
    /*protected*/ raiseEvent(name, ...args) {
        const listeners = this.listeners[name];
        if (listeners) {
            listeners.forEach(l => {
                l.apply(this, args);
            });
        }
    }
}
exports.default = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map