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
        element.appendChild(this.element.graphTemplate);
        this.svgContainer = this.element.svgContainer;
        // × inside the search box: clear text filter only
        this.element.clearSelection.addEventListener('click', () => {
            this.textFilter = '';
        });
        // "Clear Selection" button below the search box: deselect node and lift cross-filter
        this.element.clearSelectionBtn.addEventListener('click', () => {
            this.updateSelection(undefined);
        });
        const handleTextInput = (0, debounce_1.default)(() => {
            this.filterNodes(this.element.textFilter);
        }, 500);
        this.element.filterBox.addEventListener('input', handleTextInput);
        this._dimensions = { width, height };
        this.svg = d3
            .select(this.svgContainer)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        // forceLink is stored separately from the simulation so we can call
        // forceLink.links([]) and forceLink.distance/strength without recreating it.
        this.forceLink = d3
            .forceLink()
            .distance(10)
            .strength(2);
        // Simulation is stopped immediately — renderGraph starts it (animated mode)
        // or drives it manually via tick() (static mode).
        this.simulation = d3
            .forceSimulation()
            .force('link', this.forceLink)
            .force('charge', d3.forceManyBody().strength(-120))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .stop();
        this.vis = this.svg.append('svg:g');
        this.redraw();
    }
    /**
     * Sets the current text filter
     */
    set textFilter(value) {
        if (value !== this.element.textFilter) {
            this.element.filterBox.value = value;
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
        if (this.simulation) {
            const { width, height } = this._dimensions;
            (_a = this.simulation.force('center')) === null || _a === void 0 ? void 0 : _a.x(width / 2).y(height / 2);
            const style = (el) => {
                el.style.width = `${width}px`;
                el.style.height = `${height}px`;
            };
            style(this.element.graphTemplate);
            style(this.svgContainer);
            this.svg.attr('width', width).attr('height', height);
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
     */
    set configuration(newConfig) {
        var _a, _b, _c;
        if (this.simulation) {
            let runStart = false;
            const getRangeValue = (settingName, name, config) => {
                const { default: defaultValue, min, max } = config;
                let newValue = max
                    ? Math.min(newConfig[settingName][name], max)
                    : newConfig[settingName][name];
                return ((min ? Math.max(newValue, min) : newValue) || defaultValue);
            };
            const updateForceConfig = (settingName, name, config) => {
                if (newConfig[settingName][name] !==
                    this._configuration[settingName][name]) {
                    const newValue = getRangeValue(settingName, name, config);
                    newConfig[settingName][name] = newValue;
                    return true;
                }
                return false;
            };
            // Update linkDistance
            if (updateForceConfig('layout', 'linkDistance', defaults_1.linkDistance)) {
                this.forceLink.distance(newConfig.layout.linkDistance);
                runStart = true;
            }
            // Update linkStrength
            if (updateForceConfig('layout', 'linkStrength', defaults_1.linkStrength)) {
                this.forceLink.strength(newConfig.layout.linkStrength);
                runStart = true;
            }
            // Update charge
            if (updateForceConfig('layout', 'charge', defaults_1.charge)) {
                ;
                (_a = this.simulation.force('charge')) === null || _a === void 0 ? void 0 : _a.strength(newConfig.layout.charge);
                runStart = true;
            }
            // Update gravity (forceCenter strength)
            if (updateForceConfig('layout', 'gravity', defaults_1.gravity)) {
                ;
                (_b = this.simulation.force('center')) === null || _b === void 0 ? void 0 : _b.strength(newConfig.layout.gravity);
                runStart = true;
            }
            // Update zoom extents
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
                newConfig.layout.maxNodeCount = getRangeValue('layout', 'maxNodeCount', defaults_1.nodeCount);
            }
            if (newConfig.layout.animate) {
                if (!this._configuration.layout.animate) {
                    // Transition from static to animated
                    this.simulation.alpha(1).restart();
                }
                else if (runStart) {
                    this.simulation.alpha(0.3).restart();
                }
            }
            else {
                this.simulation.stop();
                if (runStart) {
                    this.reflow(this.vis.selectAll('.link'), this.vis.selectAll('.node'));
                }
            }
            // Toggle labels visibility
            if (newConfig.layout.labels !== this._configuration.layout.labels) {
                this.vis
                    .selectAll('.node text')
                    .style('display', newConfig.layout.labels ? '' : 'none');
            }
            if (newConfig.search.caseInsensitive !==
                this._configuration.search.caseInsensitive) {
                this.filterNodes((_c = this.element.filterBox.value) !== null && _c !== void 0 ? _c : '');
            }
            if (newConfig.layout.fontSizePT !== this._configuration.layout.fontSizePT) {
                newConfig.layout.fontSizePT = newConfig.layout.fontSizePT || 8;
                this.vis
                    .selectAll('.node text')
                    .attr('font-size', `${newConfig.layout.fontSizePT}pt`);
            }
        }
        this._configuration = newConfig;
        this.events.raiseEvent('visualSettingsChanged', newConfig);
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
            // Drag behavior — v7 API: (event, datum) replaces global d3.event
            const drag = d3
                .drag()
                .on('start', function (event, d) {
                event.sourceEvent.stopPropagation();
                d3.select(this).classed('dragging', true);
                if (me._configuration.layout.animate) {
                    if (!event.active)
                        me.simulation.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            })
                .on('drag', function (event, d) {
                d.fx = d.x = event.x;
                d.fy = d.y = event.y;
                if (!me._configuration.layout.animate) {
                    tick();
                }
            })
                .on('end', function (event, d) {
                d3.select(this).classed('dragging', false);
                if (me._configuration.layout.animate) {
                    if (!event.active)
                        me.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }
            });
            this.svg.remove();
            this.svg = d3
                .select(this.svgContainer)
                .append('svg')
                .attr('width', this.dimensions.width)
                .attr('height', this.dimensions.height)
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .attr('pointer-events', 'all')
                .classed('networkNavigator', true)
                .call(this.zoom);
            this.vis = this.svg.append('svg:g');
            if (this._configuration.layout.animate) {
                this.simulation.alpha(1).restart();
            }
            const edgeColorWeightDomain = (0, determineDomain_1.determineDomain)(bilinks, (b) => b[4], this._configuration.layout.minEdgeColorWeight, this._configuration.layout.maxEdgeColorWeight);
            const edgeWidthDomain = (0, determineDomain_1.determineDomain)(bilinks, (b) => b[3], this._configuration.layout.minEdgeWeight, this._configuration.layout.maxEdgeWeight);
            // D3 v7: d3.scaleLinear() replaces d3.scale.linear()
            const edgeColorScale = d3
                .scaleLinear()
                .domain(edgeColorWeightDomain)
                .range([
                this._configuration.layout.edgeStartColor,
                this._configuration.layout.edgeEndColor,
            ])
                .interpolate(d3.interpolateRgb);
            const edgeWidthScale = d3
                .scaleLinear()
                .domain(edgeWidthDomain)
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
                .style('stroke', (d) => xform(d[4], edgeColorScale, edgeColorWeightDomain, 'gray'))
                .style('stroke-width', (d) => xform(d[3], edgeWidthScale, edgeWidthDomain, defaults_1.DEFAULT_EDGE_SIZE))
                .attr('id', (d) => d[0].name.replace(/\./g, '_').replace(/@/g, '_') +
                '_' +
                d[2].name.replace(/\./g, '_').replace(/@/g, '_'));
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
                if (typeof width === 'undefined' || width === null) {
                    width = defaults_1.DEFAULT_NODE_SIZE;
                }
                const maxSize = this._configuration.layout.maxNodeSize;
                const minSize = this._configuration.layout.minNodeSize;
                width = maxSize && width > maxSize ? maxSize : width;
                width = minSize && width < minSize ? minSize : width;
                return width > 0 ? width : 0;
            })
                .style('fill', (d) => d.color)
                .style('stroke', 'red')
                .style('stroke-width', (d) => (d.selected ? 1 : 0))
                .style('opacity', (d) => (d.dimmed ? 0.2 : 1.0));
            // D3 v7: event is first argument, datum is second
            node.on('click', (_event, n) => this.updateSelection(n));
            // When labels are off: show the hovered node's label, hide on mouseout
            node.on('mouseover', function () {
                d3.select(this).select('text').style('display', '');
            });
            node.on('mouseout', function () {
                if (!me._configuration.layout.labels) {
                    d3.select(this).select('text').style('display', 'none');
                }
            });
            node.append('svg:text')
                .attr('class', 'node-label')
                .text((d) => d.name)
                .attr('fill', (d) => d.labelColor || this._configuration.layout.defaultLabelColor)
                .attr('font-size', `${this._configuration.layout.fontSizePT}pt`)
                .style('opacity', (d) => (d.dimmed ? 0.2 : 1.0))
                .style('display', this._configuration.layout.labels ? null : 'none');
            if (!this._configuration.layout.animate) {
                this.reflow(link, node);
            }
            // Tick function: update SVG positions from simulation node x/y
            const tick = () => {
                if (this._configuration.layout.animate) {
                    link.attr('x1', (d) => d[0].x)
                        .attr('y1', (d) => d[0].y)
                        .attr('x2', (d) => d[2].x)
                        .attr('y2', (d) => d[2].y);
                    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
                }
            };
            // D3 v7: 'tick' fires on the simulation object, not the force layout
            this.simulation.on('tick', tick);
        }
    }
    buildBilinks(graph) {
        const nodes = graph.nodes.slice();
        const links = [];
        const bilinks = [];
        // Bilink technique: for each logical edge s→t we insert a hidden intermediate
        // node `i` and two real force links: s→i and i→t. The SVG line is drawn
        // from s to t using i's position as an invisible midpoint anchor. This lets
        // parallel edges between the same two nodes curve without overlapping.
        // bilinks[k] = [sourceNode, intermediateNode, targetNode, edgeWidth, edgeColor]
        graph.links.forEach(graphLink => {
            const s = nodes[graphLink.source];
            const t = nodes[graphLink.target];
            const w = graphLink.value;
            const cw = graphLink.colorValue;
            const i = {};
            nodes.push(i);
            links.push({ source: s, target: i }, { source: i, target: t });
            bilinks.push([s, i, t, w, cw]);
        });
        // D3 v7: set nodes on simulation, links on forceLink
        this.simulation.nodes(nodes);
        this.forceLink.links(links);
        return bilinks;
    }
    resetZoom() {
        this.scale = defaults_1.DEFAULT_ZOOM_SCALE;
        this.translate = defaults_1.DEFAULT_ZOOM_TRANSLATE;
        this.zoomToViewport();
    }
    renderZoom() {
        // event.transform.k = scale, event.transform.x/y = translate.
        // We store scale/translate so zoomToViewport() can restore them after a redraw.
        this.zoom = d3
            .zoom()
            .scaleExtent([
            this._configuration.layout.minZoom,
            this._configuration.layout.maxZoom,
        ])
            .on('zoom', (event) => {
            this.scale = event.transform.k;
            this.translate = [event.transform.x, event.transform.y];
            if (this.vis) {
                this.vis.attr('transform', event.transform.toString());
            }
        });
    }
    /**
     * Applies the current scale and translate settings to the view.
     */
    zoomToViewport() {
        if (this.zoom && this.vis && this.svg) {
            this.vis.attr('transform', `translate(${this.translate}) scale(${this.scale})`);
            // In D3 v7, zoom.transform() is how you programmatically set the zoom
            // state. Calling it syncs the behavior's internal __zoom property on the
            // SVG element so that subsequent user gestures start from the right baseline
            // rather than snapping back to identity.
            this.svg.call(this.zoom.transform, d3.zoomIdentity
                .translate(this.translate[0], this.translate[1])
                .scale(this.scale));
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
            .attr('fill', (d) => d.labelColor || this._configuration.layout.defaultLabelColor)
            .attr('stroke', (d) => d.labelColor || this._configuration.layout.defaultLabelColor);
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
            // Toggle: clicking the already-selected node deselects it
            if (this._selectedNode) {
                this._selectedNode.selected = false;
            }
            selectedNode = undefined;
        }
        this.selectedNode = selectedNode;
        this.events.raiseEvent('selectionChanged', this._selectedNode);
    }
    /**
     * Reflows the given links and nodes using manual simulation ticks (no animation timer)
     */
    reflow(link, node) {
        // Static (non-animated) layout: advance the simulation synchronously instead
        // of letting the internal timer run. alpha() decays each tick; we stop early
        // if it drops below 0.01 (essentially converged). 150 iterations is a safe
        // upper bound for typical graph sizes.
        this.simulation.alpha(1).stop();
        for (let k = 0; k < 150 && this.simulation.alpha() > 1e-2; k++) {
            this.simulation.tick();
        }
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