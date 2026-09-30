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
exports.NetworkNavigator = void 0;
const d3 = require("d3");
const $ = require("jquery");
const debounce_1 = require("lodash-es/debounce");
const determineDomain_1 = require("./determineDomain");
const VisualSettings_1 = require("./VisualSettings");
const EventEmitter_1 = require("./base/EventEmitter");
const defaults_1 = require("./defaults");
const GraphElement_1 = require("./templates/GraphElement");
const escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
/**
 * The network navigator is an advanced force graph based component
 */
class NetworkNavigator {
    /**
     * Constructor for the network navigator
     */
    constructor(element, width = 500, height = 500) {
        /**
         * The event emitter for this graph
         */
        this.events = new EventEmitter_1.default();
        /**
         * The current translate
         */
        this.translate = defaults_1.DEFAULT_ZOOM_TRANSLATE;
        /**
         * The current scale
         */
        this.scale = defaults_1.DEFAULT_ZOOM_SCALE;
        /**
         * The raw configuration for network navigator
         */
        this._configuration = new VisualSettings_1.VisualSettings();
        this.element = new GraphElement_1.GraphElement();
        element.append(this.element.graphTemplate);
        this.svgContainer = this.element.svgContainer;
        this.element.clearSelection.on('click', () => {
            this.textFilter = '';
            this.updateSelection(undefined);
        });
        const handleTextInput = (0, debounce_1.default)(() => {
            this.filterNodes(this.element.textFilter);
        }, 500);
        this.element.filterBox.on('input', handleTextInput);
        this._dimensions = { width, height };
        this.svg = d3
            .select(this.svgContainer[0])
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        this.force = d3.layout
            .force()
            .linkDistance(10)
            .linkStrength(2)
            .gravity(0.1)
            .charge(-120)
            .size([width, height]);
        this.vis = this.svg.append('svg:g');
        this.redraw();
    }
    /**
     * Sets the current text filter
     * @param value The value of the text filter
     */
    set textFilter(value) {
        if (value !== this.element.textFilter) {
            this.element.filterBox.val(value);
            this.filterNodes(value);
        }
    }
    /**
     * Returns the dimensions of this network navigator
     */
    get dimensions() {
        return this._dimensions;
    }
    /**
     * Setter for the dimensions
     */
    set dimensions(newDimensions) {
        var _a;
        this._dimensions = {
            width: (newDimensions === null || newDimensions === void 0 ? void 0 : newDimensions.width) || this.dimensions.width,
            height: (newDimensions === null || newDimensions === void 0 ? void 0 : newDimensions.height) || this.dimensions.height,
        };
        // If we have created the force graph, then size all of our elements
        if (this.force) {
            this.force.size([(_a = this.dimensions) === null || _a === void 0 ? void 0 : _a.width, this.dimensions.height]);
            // this.force.resume()
            this.element.graphTemplate.css({
                width: this.dimensions.width,
                height: this.dimensions.height,
            });
            this.svgContainer.css({
                width: this.dimensions.width,
                height: this.dimensions.height,
            });
            this.svg.attr({
                width: this.dimensions.width,
                height: this.dimensions.height,
            });
        }
    }
    /**
     * Getter for the configuration
     */
    get configuration() {
        return this._configuration;
    }
    /**
     * Setter for the configuration
     * @param newConfig The new configuration to set
     */
    set configuration(newConfig) {
        newConfig = $.extend(true, {}, this._configuration, newConfig);
        if (this.force) {
            let runStart = false;
            const getRangeValue = (settingName, name, config) => {
                const { default: defaultValue, min, max } = config;
                let newValue = max
                    ? Math.min(newConfig[settingName][name], max)
                    : newConfig[settingName][name];
                return ((min ? Math.max(newValue, min) : newValue) ||
                    defaultValue);
            };
            /**
             * Updates the config value if necessary, and returns true if it was updated
             */
            const updateForceConfig = (settingName, name, config) => {
                if (newConfig[settingName][name] !==
                    this._configuration[settingName][name]) {
                    const newValue = getRangeValue(settingName, name, config);
                    this.force[name](newValue.toString());
                    newConfig[settingName][name] = newValue;
                    return true;
                }
            };
            // Bound all of the settings to their appropriate min/maxes
            runStart =
                updateForceConfig('layout', 'linkDistance', defaults_1.linkDistance) ||
                    runStart;
            runStart =
                updateForceConfig('layout', 'linkStrength', defaults_1.linkStrength) ||
                    runStart;
            runStart = updateForceConfig('layout', 'charge', defaults_1.charge) || runStart;
            runStart =
                updateForceConfig('layout', 'gravity', defaults_1.gravity) || runStart;
            // If the zoom has changed at all, then let the zoom behavior know
            if (((newConfig.layout.minZoom && newConfig.layout.minZoom) !==
                this._configuration.layout.minZoom ||
                (newConfig.layout.maxZoom && newConfig.layout.maxZoom) !==
                    this._configuration.layout.maxZoom) &&
                this.zoom) {
                this.zoom.scaleExtent([
                    newConfig.layout.minZoom,
                    newConfig.layout.maxZoom,
                ]);
            }
            if (this._configuration.layout.maxNodeCount !==
                newConfig.layout.maxNodeCount) {
                const newValue = getRangeValue('layout', 'maxNodeCount', defaults_1.nodeCount);
                newConfig.layout.maxNodeCount = newValue;
            }
            if (newConfig.layout.animate) {
                // If we are rerunning start or if we weren't animated, but now we are, then start the force
                if (false || !this._configuration.layout.animate) {
                    this.force.start();
                }
            }
            else {
                this.force.stop();
                if (runStart) {
                    this.reflow(this.vis.selectAll('.link'), this.vis.selectAll('.node'));
                }
            }
            // Rerender the labels if necessary
            if (newConfig.layout.labels !== this._configuration.layout.labels) {
                this.vis
                    .selectAll('.node text')
                    .style('display', newConfig.layout.labels ? '' : 'none');
            }
            if (newConfig.search.caseInsensitive !==
                this._configuration.search.caseInsensitive) {
                this.filterNodes(this.element.filterBox.val());
            }
            if (newConfig.layout.fontSizePT !==
                this._configuration.layout.fontSizePT) {
                newConfig.layout.fontSizePT = newConfig.layout.fontSizePT || 8;
                this.vis
                    .selectAll('.node text')
                    .attr('font-size', () => `${newConfig.layout.fontSizePT}pt`);
            }
        }
        this._configuration = newConfig;
        this.events.raiseEvent('visualSettingsChanged', newConfig);
        this.redraw();
    }
    /**
     * Sets the selected node
     */
    set selectedNode(n) {
        if (this._selectedNode !== n) {
            if (this._selectedNode) {
                this._selectedNode.selected = false;
            }
            this._selectedNode = n;
            if (n) {
                n.selected = true;
            }
            this.redrawSelection();
        }
    }
    /**
     * Gets the currently selected node
     */
    get selectedNode() {
        return this._selectedNode;
    }
    /**
     * Redraws the force network navigator
     */
    redraw() {
        this.renderGraph();
        this.zoomToViewport();
    }
    /**
     * Renders the graph to the user
     */
    renderGraph() {
        if (this.graph) {
            const graph = this.graph;
            const me = this;
            this.renderZoom();
            const bilinks = this.buildBilinks(this.graph);
            const drag = d3.behavior
                .drag()
                // tslint:disable-line only-arrow-functions
                .origin((d) => d)
                // The use of "function" is important to preserve "this"
                .on('dragstart', function (d) {
                // Stop the force graph animation while we are dragging, otherwise it causes the graph to
                // jitter while you drag it
                ;
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed('dragging', true);
                me.force.stop();
            })
                // tslint:disable-next-line
                .on('drag', function (d) {
                // While we drag, adjust the dragged node, and tell our node renderer to draw a frame
                const evt = d3.event;
                d.px = d.x = evt.x;
                d.py = d.y = evt.y;
                tick();
            })
                // tslint:disable-line only-arrow-functions
                .on('dragend', function (d) {
                d3.select(this).classed('dragging', false);
                // If we have animation on, then start that beast
                if (me._configuration.layout.animate) {
                    me.force.resume();
                }
            });
            this.svg.remove();
            this.svg = d3
                .select(this.svgContainer[0])
                .append('svg')
                .attr('width', this.dimensions.width)
                .attr('height', this.dimensions.height)
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('pointer-events', 'all')
                .classed('networkNavigator', true)
                .call(this.zoom);
            this.vis = this.svg.append('svg:g');
            // If we have animation on, then start that beast
            if (this._configuration.layout.animate) {
                this.force.start();
            }
            const edgeColorWeightDomain = (0, determineDomain_1.determineDomain)(bilinks, b => b[4], this._configuration.layout.minEdgeColorWeight, this._configuration.layout.maxEdgeColorWeight);
            const edgeWidthDomain = (0, determineDomain_1.determineDomain)(bilinks, b => b[3], this._configuration.layout.minEdgeWeight, this._configuration.layout.maxEdgeWeight);
            const edgeColorScale = d3.scale
                .linear()
                .domain(edgeColorWeightDomain)
                .interpolate(d3.interpolateRgb)
                .range([
                this._configuration.layout.edgeStartColor,
                this._configuration.layout.edgeEndColor,
            ]);
            const edgeWidthScale = d3.scale
                .linear()
                .domain(edgeWidthDomain)
                .interpolate(d3.interpolateNumber)
                .range([
                this._configuration.layout.edgeMinWidth,
                this._configuration.layout.edgeMaxWidth,
            ]);
            const domainBound = (v, domain) => Math.min(domain[1], Math.max(domain[0], v));
            const xform = (v, scale, domain, defaultValue) => {
                const isValuePresent = v !== undefined;
                const boundedValue = isValuePresent ? domainBound(v, domain) : v;
                return isValuePresent ? scale(boundedValue) : defaultValue;
            };
            this.vis
                .append('svg:defs')
                .selectAll('marker')
                .data(['end'])
                .enter()
                .append('svg:marker')
                .attr('id', String)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 15)
                .attr('refY', 0)
                .attr('markerWidth', 7)
                .attr('markerHeight', 7)
                .attr('orient', 'auto')
                .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5');
            const link = this.vis
                .selectAll('.link')
                .data(bilinks)
                .enter()
                .append('line')
                .attr('class', 'link')
                // tslint:disable-next-line
                .style('stroke', function (d) {
                return xform(d[4], edgeColorScale, edgeColorWeightDomain, 'gray');
            })
                // tslint:disable-next-line
                .style('stroke-width', function (d) {
                return xform(d[3], edgeWidthScale, edgeWidthDomain, defaults_1.DEFAULT_EDGE_SIZE);
            })
                // tslint:disable-next-line
                .attr('id', function (d) {
                return (d[0].name.replace(/\./g, '_').replace(/@/g, '_') +
                    '_' +
                    d[2].name.replace(/\./g, '_').replace(/@/g, '_'));
            });
            const node = this.vis
                .selectAll('.node')
                .data(graph.nodes)
                .enter()
                .append('g')
                .call(drag)
                .attr('class', 'node');
            node.append('svg:circle')
                .attr('r', (d) => {
                let width = d.value;
                // tslint:disable
                if (typeof width === 'undefined' || width === null) {
                    // tslint:enable
                    width = defaults_1.DEFAULT_NODE_SIZE;
                }
                const maxSize = this._configuration.layout.maxNodeSize;
                const minSize = this._configuration.layout.minNodeSize;
                width = maxSize && width > maxSize ? maxSize : width;
                width = minSize && width < minSize ? minSize : width;
                // Make sure > 0
                return width > 0 ? width : 0;
            })
                .style('fill', (d) => d.color)
                .style('stroke', 'red')
                .style('stroke-width', (d) => (d.selected ? 1 : 0))
                .style('opacity', (d) => (d.dimmed ? 0.2 : 1.0));
            node.on('click', (n) => this.updateSelection(n));
            node.on('mouseover', () => {
                // tslint:disable
                d3.select(this.svgContainer.find('svg text')[0]).style('display', null);
                // tslint:enable
            });
            node.on('mouseout', () => {
                if (!this._configuration.layout.labels) {
                    d3.select(this.svgContainer.find('svg text')[0]).style('display', 'none');
                }
            });
            link.append('svg:text')
                .text((d) => 'yes')
                .attr('fill', 'black')
                .attr('stroke', 'black')
                .attr('font-size', () => `${this._configuration.layout.fontSizePT}pt`)
                .attr('stroke-width', '0.5px')
                .attr('class', 'linklabel')
                .attr('text-anchor', 'middle');
            node.append('svg:text')
                .attr('class', 'node-label')
                .text((d) => d.name)
                .attr('fill', (d) => d.labelColor ||
                this._configuration.layout.defaultLabelColor)
                .attr('stroke', (d) => d.labelColor ||
                this._configuration.layout.defaultLabelColor)
                .attr('font-size', () => `${this._configuration.layout.fontSizePT}pt`)
                .attr('stroke-width', '0.5px')
                .style('opacity', (d) => (d.dimmed ? 0.2 : 1.0))
                // tslint:disable
                .style('display', this._configuration.layout.labels ? null : 'none');
            // tslint:enable
            // If we are not animating, then play the force quickly
            if (!this._configuration.layout.animate) {
                this.reflow(link, node);
            }
            // Our tick function, which actually moves the nodes on the svg based on their x/y positions
            const tick = () => {
                if (this._configuration.layout.animate) {
                    link.attr('x1', d => d[0].x)
                        .attr('y1', d => d[0].y)
                        .attr('x2', d => d[2].x)
                        .attr('y2', d => d[2].y);
                    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
                }
            };
            this.force.on('tick', tick);
        }
    }
    buildBilinks(graph) {
        const nodes = graph.nodes.slice();
        const links = [];
        const bilinks = [];
        graph.links.forEach(graphLink => {
            const s = nodes[graphLink.source];
            const t = nodes[graphLink.target];
            const w = graphLink.value;
            const cw = graphLink.colorValue;
            const i = {}; // intermediate node
            nodes.push(i);
            links.push({ source: s, target: i }, { source: i, target: t });
            bilinks.push([s, i, t, w, cw]);
        });
        this.force.nodes(nodes).links(links);
        return bilinks;
    }
    resetZoom() {
        this.scale = defaults_1.DEFAULT_ZOOM_SCALE;
        this.translate = defaults_1.DEFAULT_ZOOM_TRANSLATE;
        this.zoomToViewport();
    }
    renderZoom() {
        this.zoom = d3.behavior
            .zoom()
            .scaleExtent([
            this._configuration.layout.minZoom,
            this._configuration.layout.maxZoom,
        ])
            .on('zoom', () => {
            const event = d3.event;
            this.scale = event.scale;
            this.translate = event.translate;
            this.zoomToViewport();
        });
    }
    /**
     * Applies the current scale and translate settings to the view.
     */
    zoomToViewport() {
        if (this.zoom && this.vis) {
            this.vis.attr('transform', `translate(${this.translate}) scale(${this.scale})`);
            this.zoom.scale(this.scale);
            this.zoom.translate(this.translate);
        }
    }
    /**
     * Gets the data associated with this graph
     */
    get data() {
        return this.graph;
    }
    /**
     * Sets the data for this force graph
     */
    set data(graph) {
        this.graph = graph;
        this.redraw();
    }
    /**
     * Redraws the selections on the nodes
     */
    redrawSelection() {
        this.vis
            .selectAll('.node circle')
            .style('stroke-width', (d) => (d.selected ? 1 : 0));
    }
    /**
     * Sets highlight mode for bi-directional cross-filtering.
     * @param highlightedNodeNames Set of node names that should remain fully opaque.
     *   Pass undefined to clear highlight mode (all nodes fully opaque).
     */
    setHighlightMode(highlightedNodeNames) {
        var _a;
        this._highlightedNodeNames = highlightedNodeNames;
        const nodes = (_a = this.graph) === null || _a === void 0 ? void 0 : _a.nodes;
        if (nodes) {
            nodes.forEach(n => {
                n.dimmed =
                    highlightedNodeNames !== undefined &&
                        !!n.name &&
                        !highlightedNodeNames.has(n.name);
            });
        }
        this.redrawHighlights();
    }
    /**
     * Redraws node and label opacity to reflect the current highlight/dim state.
     */
    redrawHighlights() {
        this.vis
            .selectAll('.node circle')
            .style('opacity', (d) => (d.dimmed ? 0.2 : 1.0));
        this.vis
            .selectAll('.node .node-label')
            .style('opacity', (d) => (d.dimmed ? 0.2 : 1.0));
        // Also dim edges where both endpoints are dimmed
        this.vis
            .selectAll('.link')
            .style('opacity', (d) => { var _a, _b; return ((_a = d[0]) === null || _a === void 0 ? void 0 : _a.dimmed) && ((_b = d[2]) === null || _b === void 0 ? void 0 : _b.dimmed) ? 0.1 : 0.8; });
    }
    /**
     * Redraws the node labels
     */
    redrawLabels() {
        this.vis
            .selectAll('.node .node-label')
            .attr('fill', (d) => d.labelColor ||
            this._configuration.layout.defaultLabelColor)
            .attr('stroke', (d) => d.labelColor ||
            this._configuration.layout.defaultLabelColor);
    }
    /**
     * Filters the nodes to the given string
     */
    filterNodes(text, animate = true) {
        let temp = this.vis.selectAll('.node circle');
        if (animate) {
            temp = temp.transition().duration(500).delay(100);
        }
        const pretty = (val) => (val || '') + '';
        temp.attr('transform', (d) => {
            // If the node matches the search string, then scale it
            let scale = 1;
            const searchStr = d.name || '';
            const flags = this._configuration.search.caseInsensitive ? 'i' : '';
            const regex = new RegExp(escapeRegExp(text), flags);
            if (text && regex.test(pretty(searchStr))) {
                scale = 3;
            }
            return `scale(${scale})`;
        });
    }
    /**
     * Updates the selection based on the given node
     * @param n The node to update selection for
     */
    updateSelection(n) {
        let selectedNode = n;
        if (n !== this._selectedNode) {
            if (this._selectedNode) {
                this._selectedNode.selected = false;
            }
            if (n) {
                n.selected = true;
            }
        }
        else {
            // Toggle the selected node
            if (this._selectedNode) {
                this._selectedNode.selected = false;
            }
            selectedNode = undefined;
        }
        this.selectedNode = selectedNode;
        this.events.raiseEvent('selectionChanged', this._selectedNode);
    }
    /**
     * Reflows the given links and nodes
     */
    reflow(link, node) {
        let k = 0;
        this.force.start();
        // Alpha measures the amount of movement
        while (this.force.alpha() > 1e-2 && k < 150) {
            this.force['tick']();
            k = k + 1;
        }
        this.force.stop();
        this.createConnections(link, node);
    }
    createConnections(link, node) {
        link.attr('x1', (d) => d[0].x)
            .attr('y1', (d) => d[0].y)
            .attr('x2', (d) => d[2].x)
            .attr('y2', (d) => d[2].y);
        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    }
}
exports.NetworkNavigator = NetworkNavigator;
//# sourceMappingURL=NetworkNavigator.js.map