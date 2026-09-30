/// <reference types="jquery" />
/// <reference types="jquery" />
export declare class GraphElement {
    private element;
    constructor();
    get graphTemplate(): JQuery;
    get svgContainer(): JQuery;
    get clearSelection(): JQuery;
    get filterBox(): JQuery<HTMLElement>;
    get textFilter(): string;
    private template;
}
