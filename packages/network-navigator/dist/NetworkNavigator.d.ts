/// <reference types="jquery" />
/// <reference types="jquery" />
import { VisualSettings } from './VisualSettings';
import EventEmitter from './base/EventEmitter';
import type { INetworkNavigatorData, INetworkNavigatorNode } from './interfaces';
/**
 * The network navigator is an advanced force graph based component
 */
export declare class NetworkNavigator {
    /**
     * The event emitter for this graph
     */
    events: EventEmitter;
    /**
     * The current translate
     */
    translate: [number, number];
    /**
     * The current scale
     */
    scale: number;
    /**
     * The element into which the network navigator is loaded
     */
    private element;
    /**
     * A div to containg the svg
     */
    private svgContainer;
    /**
     * The svg element of the visualization
     */
    private svg;
    /**
     * The main visual element
     */
    private vis;
    /**
     * The force graph reference
     */
    private force;
    /**
     * The d3 zoom behavior
     */
    private zoom?;
    /**
     * The raw graph data given to network navigator
     */
    private graph?;
    /**
     * The dimensions of network navigator
     */
    private _dimensions;
    /**
     * The currently selected node
     */
    private _selectedNode?;
    /**
     * When set, only these node names are "active"; all others are dimmed.
     * Undefined means no external highlight is active (all nodes fully opaque).
     */
    private _highlightedNodeNames?;
    /**
     * The raw configuration for network navigator
     */
    private _configuration;
    /**
     * Constructor for the network navigator
     */
    constructor(element: JQuery, width?: number, height?: number);
    /**
     * Sets the current text filter
     * @param value The value of the text filter
     */
    set textFilter(value: string);
    /**
     * Returns the dimensions of this network navigator
     */
    get dimensions(): {
        width: number;
        height: number;
    };
    /**
     * Setter for the dimensions
     */
    set dimensions(newDimensions: {
        width: number;
        height: number;
    });
    /**
     * Getter for the configuration
     */
    get configuration(): VisualSettings;
    /**
     * Setter for the configuration
     * @param newConfig The new configuration to set
     */
    set configuration(newConfig: VisualSettings);
    /**
     * Sets the selected node
     */
    set selectedNode(n: INetworkNavigatorNode | undefined);
    /**
     * Gets the currently selected node
     */
    get selectedNode(): INetworkNavigatorNode | undefined;
    /**
     * Redraws the force network navigator
     */
    redraw(): void;
    /**
     * Renders the graph to the user
     */
    renderGraph(): void;
    private buildBilinks;
    resetZoom(): void;
    private renderZoom;
    /**
     * Applies the current scale and translate settings to the view.
     */
    private zoomToViewport;
    /**
     * Gets the data associated with this graph
     */
    get data(): INetworkNavigatorData<INetworkNavigatorNode>;
    /**
     * Sets the data for this force graph
     */
    set data(graph: INetworkNavigatorData<INetworkNavigatorNode>);
    /**
     * Redraws the selections on the nodes
     */
    redrawSelection(): void;
    /**
     * Sets highlight mode for bi-directional cross-filtering.
     * @param highlightedNodeNames Set of node names that should remain fully opaque.
     *   Pass undefined to clear highlight mode (all nodes fully opaque).
     */
    setHighlightMode(highlightedNodeNames?: Set<string>): void;
    /**
     * Redraws node and label opacity to reflect the current highlight/dim state.
     */
    redrawHighlights(): void;
    /**
     * Redraws the node labels
     */
    redrawLabels(): void;
    /**
     * Filters the nodes to the given string
     */
    filterNodes(text: string, animate?: boolean): void;
    /**
     * Updates the selection based on the given node
     * @param n The node to update selection for
     */
    updateSelection(n?: INetworkNavigatorNode): void;
    /**
     * Reflows the given links and nodes
     */
    private reflow;
    private createConnections;
}
