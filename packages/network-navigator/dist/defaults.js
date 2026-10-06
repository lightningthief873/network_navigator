"use strict";
/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeMaxWidth = exports.edgeMinWidth = exports.fontSizePT = exports.maxZoom = exports.minZoom = exports.charge = exports.gravity = exports.linkStrength = exports.nodeCount = exports.linkDistance = exports.DEFAULT_CONFIGURATION = exports.DEFAULT_ZOOM_TRANSLATE = exports.DEFAULT_ZOOM_SCALE = exports.DEFAULT_EDGE_SIZE = exports.DEFAULT_NODE_SIZE = void 0;
/**
 * The default node size in px
 */
exports.DEFAULT_NODE_SIZE = 10;
/**
 * The default size of edges in px
 */
exports.DEFAULT_EDGE_SIZE = 1;
exports.DEFAULT_ZOOM_SCALE = 1;
exports.DEFAULT_ZOOM_TRANSLATE = [0, 0];
/**
 * The default configuration used with network navigator
 */
exports.DEFAULT_CONFIGURATION = {
    animate: false,
    linkDistance: 10,
    linkStrength: 2,
    charge: -120,
    gravity: 0.1,
    labels: true,
    minZoom: 0.1,
    maxZoom: 100,
    caseInsensitive: true,
    maxNodeCount: 1000,
    defaultLabelColor: '#000000',
    fontSizePT: 10,
    maxNodeSize: 500,
    minNodeSize: 1,
    edgeStartColor: '#FDFEFE',
    edgeEndColor: '#273746',
    edgeMinWidth: 1,
    edgeMaxWidth: 5,
};
/**
 * Defines the minimum, maximum, and default values for link distance
 */
exports.linkDistance = {
    min: 1,
    max: 30,
    default: exports.DEFAULT_CONFIGURATION.linkDistance,
};
/**
 * Defines the minimum, maximum, and default values for node count
 */
exports.nodeCount = {
    min: 0,
    max: 30000,
    default: exports.DEFAULT_CONFIGURATION.maxNodeCount,
};
/**
 * Defines the minimum, maximum, and default values for link strength
 */
exports.linkStrength = {
    min: 1,
    max: 20,
    default: exports.DEFAULT_CONFIGURATION.linkStrength,
};
/**
 * Defines the minimum, maximum, and default values for gravity
 */
exports.gravity = {
    min: 0.1,
    max: 10,
    default: exports.DEFAULT_CONFIGURATION.gravity,
};
/**
 * Defines the minimum, maximum, and default values for charge
 */
exports.charge = {
    min: -100000,
    max: 10,
    default: exports.DEFAULT_CONFIGURATION.charge,
};
/**
 * Defines the minimum, maximum, and default values for the minimum zoom of the graph
 */
exports.minZoom = {
    min: 0.0001,
    max: 100000,
    default: exports.DEFAULT_CONFIGURATION.minZoom,
};
/**
 * Defines the minimum, maximum, and default values for the maximum zoom of the graph
 */
exports.maxZoom = {
    min: 0.0001,
    max: 100000,
    default: exports.DEFAULT_CONFIGURATION.maxZoom,
};
/**
 * Defines the minimum, maximum, and default values for the font size
 */
exports.fontSizePT = {
    min: 6,
    max: 40,
    default: exports.DEFAULT_CONFIGURATION.fontSizePT,
};
/**
 * The default, min, and max width for the minimum edge width
 */
exports.edgeMinWidth = {
    min: 0,
    max: 15,
    default: exports.DEFAULT_CONFIGURATION.edgeMinWidth,
};
/**
 * The default, min, and max width for the maximum edge width
 */
exports.edgeMaxWidth = {
    min: 1,
    max: 15,
    default: exports.DEFAULT_CONFIGURATION.edgeMaxWidth,
};
//# sourceMappingURL=defaults.js.map