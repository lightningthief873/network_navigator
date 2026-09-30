/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualSettings = void 0;
const powerbi_visuals_utils_dataviewutils_1 = require("powerbi-visuals-utils-dataviewutils");
const defaults_1 = require("./defaults");
var DataViewObjectsParser = powerbi_visuals_utils_dataviewutils_1.dataViewObjectsParser.DataViewObjectsParser;
class SearchSettings {
    constructor() {
        this.caseInsensitive = defaults_1.DEFAULT_CONFIGURATION.caseInsensitive;
    }
}
class LayoutSettings {
    constructor() {
        this.animate = defaults_1.DEFAULT_CONFIGURATION.animate;
        this.maxNodeCount = defaults_1.DEFAULT_CONFIGURATION.maxNodeCount;
        this.maxNodeSize = defaults_1.DEFAULT_CONFIGURATION.maxNodeSize;
        this.minNodeSize = defaults_1.DEFAULT_CONFIGURATION.minNodeSize;
        this.linkDistance = defaults_1.DEFAULT_CONFIGURATION.linkDistance;
        this.linkStrength = defaults_1.DEFAULT_CONFIGURATION.linkStrength;
        this.gravity = defaults_1.DEFAULT_CONFIGURATION.gravity;
        this.charge = defaults_1.DEFAULT_CONFIGURATION.charge;
        this.labels = defaults_1.DEFAULT_CONFIGURATION.labels;
        this.minZoom = defaults_1.DEFAULT_CONFIGURATION.minZoom;
        this.maxZoom = defaults_1.DEFAULT_CONFIGURATION.maxZoom;
        this.defaultLabelColor = defaults_1.DEFAULT_CONFIGURATION.defaultLabelColor;
        this.fontSizePT = defaults_1.DEFAULT_CONFIGURATION.fontSizePT;
        this.minEdgeWeight = null;
        this.maxEdgeWeight = null;
        this.minEdgeColorWeight = null;
        this.maxEdgeColorWeight = null;
        this.edgeMinWidth = defaults_1.DEFAULT_CONFIGURATION.edgeMinWidth;
        this.edgeMaxWidth = defaults_1.DEFAULT_CONFIGURATION.edgeMaxWidth;
        this.edgeStartColor = defaults_1.DEFAULT_CONFIGURATION.edgeStartColor;
        this.edgeEndColor = defaults_1.DEFAULT_CONFIGURATION.edgeEndColor;
    }
}
class VisualSettings extends DataViewObjectsParser {
    constructor() {
        super(...arguments);
        this.search = new SearchSettings();
        this.layout = new LayoutSettings();
    }
}
exports.VisualSettings = VisualSettings;
//# sourceMappingURL=VisualSettings.js.map