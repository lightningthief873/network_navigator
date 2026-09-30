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
     * A div containing the svg
     */
    private svgContainer;
    /**
     * The svg element of the visualization
     */
    private svg;
    /**
     * The main visual group inside the svg
     */
    private vis;
    /**
     * The D3 force simulation (replaces D3 v3 force layout)
     */
    private simulation;
    /**
     * The forceLink force — stored separately so links can be updated independently
     */
    private forceLink;
    /**
     * The D3 zoom behavior
     */
    private zoom;
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
     * The raw configuration for network navigator
     */
    private _configuration;
    /**
     * When set, only these node names are "active"; all others are dimmed.
     * Undefined means no external highlight is active (all nodes fully opaque).
     */
    private _highlightedNodeNames?;
    /**
     * Constructor for the network navigator
     */
    constructor(element: HTMLElement, width?: number, height?: number);
    /**
     * Sets the current text filter
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
     */
    updateSelection(n?: INetworkNavigatorNode): void;
    /**
     * Reflows the given links and nodes using manual simulation ticks (no animation timer)
     */
    private reflow;
    private createConnections;
}
