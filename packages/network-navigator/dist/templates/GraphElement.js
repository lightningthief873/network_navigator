"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphElement = void 0;
/**
 * The template for the network navigator — vanilla DOM, no jQuery
 */
class GraphElement {
    constructor() {
        const div = document.createElement('div');
        div.innerHTML = `<div class="graph-container"><div class="button-bar"><div class="input-box"><input type="text" autocomplete="off" placeholder="Enter text filter" id="search-filter-box"/><a id="clear-text-btn"><span class="clear-selection-button"></span></a></div><button id="clear-selection-btn" class="clear-selection-btn">Clear Selection</button></div><div class="svg-container"></div></div>`;
        this._root = div.firstElementChild;
    }
    get graphTemplate() {
        return this._root;
    }
    get svgContainer() {
        return this._root.querySelector('.svg-container');
    }
    /** The × icon that clears the text filter */
    get clearSelection() {
        return this._root.querySelector('#clear-text-btn');
    }
    /** The "Clear Selection" button below the search bar */
    get clearSelectionBtn() {
        return this._root.querySelector('#clear-selection-btn');
    }
    get filterBox() {
        return this._root.querySelector('#search-filter-box');
    }
    get textFilter() {
        var _a, _b;
        return (_b = (_a = this.filterBox) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
    }
}
exports.GraphElement = GraphElement;
//# sourceMappingURL=GraphElement.js.map