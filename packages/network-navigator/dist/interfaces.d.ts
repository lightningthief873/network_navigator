/**
 * The node in a graph
 */
export declare type Handler = () => void;
export interface INetworkNavigatorNode {
    /**
     * The name of the node
     */
    name?: string;
    /**
     * The color of the node
     */
    color?: string;
    /**
     * The color of the label of the node
     */
    labelColor?: string;
    /**
     * The size of the node
     */
    value?: number;
    /**
     * Whether or not the given node is selected
     */
    selected: boolean;
    /**
     * Whether this node is dimmed due to an external cross-highlight selection
     * (another visual has highlighted something that does not include this node)
     */
    dimmed?: boolean;
}
/**
 * Represents a link in the network navigator
 */
export interface INetworkNavigatorLink {
    /**
     * The source node, index into the nodes list
     */
    source: number;
    /**
     * The target node, index into the nodes list
     */
    target: number;
    /**
     * The value of the link, used to weight the link width
     */
    value?: number;
    /**
     * The value of the link, used to weight the link color
     */
    colorValue?: number;
}
/**
 * The data for the network navigator
 */
export interface INetworkNavigatorData<NodeType> {
    /**
     * The list of the nodes in the graph
     */
    nodes: NodeType[];
    /**
     * The links in the graph
     */
    links: INetworkNavigatorLink[];
}
/**
 * Represents the configuration for the network navigator
 */
export interface INetworkNavigatorConfiguration {
    /**
     * Enable/disable animation of the graph
     */
    animate: boolean;
    /**
     * The link distance used in the force graph
     */
    linkDistance: number;
    /**
     * The link strength used in the force graph
     */
    linkStrength: number;
    /**
     * The charge in the force graph
     */
    charge: number;
    /**
     * The gravity used in the force graph
     */
    gravity: number;
    caseInsensitive: boolean;
    /**
     * Should labels be shown on the graph
     */
    labels: boolean;
    /**
     * The minimum amount that a user can zoom into the graph
     */
    minZoom: number;
    /**
     * The maximum amount that a user can zoom into the graph
     */
    maxZoom: number;
    /**
     * The maximum number of nodes to render
     */
    maxNodeCount?: number;
    /**
     * The maximum size of a node to render
     */
    maxNodeSize?: number;
    /**
     * The minimum size of a node to render
     */
    minNodeSize?: number;
    /**
     * The default color used for labels
     */
    defaultLabelColor: string;
    /**
     * The size of the font to use for the labels, in pt
     */
    fontSizePT: number;
    /**
     * The minimum edge weight
     */
    minEdgeWeight?: number;
    /**
     * The maximum edge weight
     */
    maxEdgeWeight?: number;
    /**
     * The minimum width of edges
     */
    edgeMinWidth?: number;
    /**
     * The maximum width of edges
     */
    edgeMaxWidth?: number;
    /**
     * The minimum edge color-weight
     */
    minEdgeColorWeight?: number;
    /**
     * The maximum edge color-weight
     */
    maxEdgeColorWeight?: number;
    /**
     * The edge weight starting color
     */
    edgeStartColor?: string;
    /**
     * The edge weight ending color
     */
    edgeEndColor?: string;
}
