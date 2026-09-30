import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
declare class SearchSettings {
    caseInsensitive: boolean;
}
declare class LayoutSettings {
    animate: boolean;
    maxNodeCount?: number;
    maxNodeSize?: number;
    minNodeSize: number;
    linkDistance: number;
    linkStrength: number;
    gravity: number;
    charge: number;
    labels: boolean;
    minZoom: number;
    maxZoom: number;
    defaultLabelColor: string;
    fontSizePT: number;
    minEdgeWeight?: number;
    maxEdgeWeight?: number;
    minEdgeColorWeight?: number;
    maxEdgeColorWeight?: number;
    edgeMinWidth: number;
    edgeMaxWidth: number;
    edgeStartColor: string;
    edgeEndColor: string;
}
export declare class VisualSettings extends DataViewObjectsParser {
    search: SearchSettings;
    layout: LayoutSettings;
}
export {};
