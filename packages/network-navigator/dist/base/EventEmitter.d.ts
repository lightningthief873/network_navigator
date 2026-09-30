/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
/**
 * A mixin that adds support for event emitting
 */
export default class EventEmitter {
    private listeners;
    /**
     * Adds an event listener for the given event
     */
    on(name: string, handler: any): {
        destroy: () => void;
    };
    /**
     * Removes an event listener for the given event
     */
    off(name: string, handler: any): void;
    /**
     * Raises the given event
     */
    raiseEvent(name: string, ...args: any[]): void;
}
