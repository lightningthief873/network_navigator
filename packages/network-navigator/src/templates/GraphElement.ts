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

/**
 * The template for the network navigator — vanilla DOM, no jQuery
 */
export class GraphElement {
	private _root: HTMLElement

	constructor() {
		const div = document.createElement('div')
		div.innerHTML = `<div class="graph-container"><div class="button-bar"><div class="input-box"><input type="text" autocomplete="off" placeholder="Enter text filter" id="search-filter-box"/><a id="clear-text-btn"><span class="clear-selection-button"></span></a></div><button id="clear-selection-btn" class="clear-selection-btn">Clear Selection</button></div><div class="svg-container"></div></div>`
		this._root = div.firstElementChild as HTMLElement
	}

	public get graphTemplate(): HTMLElement {
		return this._root
	}

	public get svgContainer(): HTMLElement {
		return this._root.querySelector('.svg-container') as HTMLElement
	}

	/** The × icon that clears the text filter */
	public get clearSelection(): HTMLElement {
		return this._root.querySelector('#clear-text-btn') as HTMLElement
	}

	/** The "Clear Selection" button below the search bar */
	public get clearSelectionBtn(): HTMLElement {
		return this._root.querySelector('#clear-selection-btn') as HTMLElement
	}

	public get filterBox(): HTMLInputElement {
		return this._root.querySelector('#search-filter-box') as HTMLInputElement
	}

	public get textFilter(): string {
		return this.filterBox?.value ?? ''
	}
}
