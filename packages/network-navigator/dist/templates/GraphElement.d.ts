/**
 * The template for the network navigator — vanilla DOM, no jQuery
 */
export declare class GraphElement {
    private _root;
    constructor();
    get graphTemplate(): HTMLElement;
    get svgContainer(): HTMLElement;
    get clearSelection(): HTMLElement;
    get filterBox(): HTMLInputElement;
    get textFilter(): string;
}
