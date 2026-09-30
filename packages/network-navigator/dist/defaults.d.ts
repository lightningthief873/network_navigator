import type { INetworkNavigatorConfiguration } from './interfaces';
/**
 * The default node size in px
 */
export declare const DEFAULT_NODE_SIZE = 10;
/**
 * The default size of edges in px
 */
export declare const DEFAULT_EDGE_SIZE = 1;
export declare const DEFAULT_ZOOM_SCALE = 1;
export declare const DEFAULT_ZOOM_TRANSLATE: [number, number];
/**
 * The default configuration used with network navigator
 */
export declare const DEFAULT_CONFIGURATION: INetworkNavigatorConfiguration;
/**
 * Defines the minimum, maximum, and default values for link distance
 */
export declare const linkDistance: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for node count
 */
export declare const nodeCount: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for link strength
 */
export declare const linkStrength: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for gravity
 */
export declare const gravity: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for charge
 */
export declare const charge: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for the minimum zoom of the graph
 */
export declare const minZoom: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for the maximum zoom of the graph
 */
export declare const maxZoom: {
    min: number;
    max: number;
    default: number;
};
/**
 * Defines the minimum, maximum, and default values for the font size
 */
export declare const fontSizePT: {
    min: number;
    max: number;
    default: number;
};
/**
 * The default, min, and max width for the minimum edge width
 */
export declare const edgeMinWidth: {
    min: number;
    max: number;
    default: number;
};
/**
 * The default, min, and max width for the maximum edge width
 */
export declare const edgeMaxWidth: {
    min: number;
    max: number;
    default: number;
};
