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
 * The template for the network navigator
 */
const $ = require("jquery");
class GraphElement {
    constructor() {
        this.element = $(this.template());
    }
    get graphTemplate() {
        return this.element;
    }
    get svgContainer() {
        return this.element.find('.svg-container');
    }
    get clearSelection() {
        return this.element.find('#clear-selection');
    }
    get filterBox() {
        return this.element.find('#search-filter-box');
    }
    get textFilter() {
        return this.filterBox.val();
    }
    template() {
        return `
        <div class="graph-container">
            <div class="button-bar">
                <div class="input-box">
                    <input type="text" autocomplete="off" placeholder="Enter text filter" id="search-filter-box"/>
                    <a id="clear-selection">
                        <span class="clear-selection-button"></span>
                    </a>
                </div>
            </div>
            <div class="svg-container">
            </div>
        </div>
    `
            .trim()
            .replace(/[\r\n]/g, '');
    }
}
exports.GraphElement = GraphElement;
//# sourceMappingURL=GraphElement.js.map