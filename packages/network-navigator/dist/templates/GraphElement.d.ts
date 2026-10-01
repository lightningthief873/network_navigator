/**
 * The template for the network navigator — vanilla DOM, no jQuery
 */
export declare class GraphElement {
    private _root;
    constructor();
    get graphTemplate(): HTMLElement;
    get svgContainer(): HTMLElement;
    /** The × icon that clears the text filter */
    get clearSelection(): HTMLElement;
    /** The "Clear Selection" button below the search bar */
    get clearSelectionBtn(): HTMLElement;
    get filterBox(): HTMLInputElement;
    get textFilter(): string;
}
