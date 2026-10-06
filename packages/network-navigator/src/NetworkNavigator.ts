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

import * as d3 from 'd3'
import debounce from 'lodash-es/debounce'
import { determineDomain } from './determineDomain'
import { VisualSettings } from './VisualSettings'
import EventEmitter from './base/EventEmitter'
import {
	charge,
	DEFAULT_EDGE_SIZE,
	DEFAULT_NODE_SIZE,
	DEFAULT_ZOOM_SCALE,
	DEFAULT_ZOOM_TRANSLATE,
	gravity,
	linkDistance,
	linkStrength,
	nodeCount,
} from './defaults'
import type {
	INetworkNavigatorConfiguration,
	INetworkNavigatorData,
	INetworkNavigatorNode,
} from './interfaces'
import { GraphElement } from './templates/GraphElement'

const escapeRegExp = (str: string) =>
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')

/**
 * The network navigator is an advanced force graph based component
 */
export class NetworkNavigator {
	/**
	 * The event emitter for this graph
	 */
	public events = new EventEmitter()

	/**
	 * The current translate
	 */
	public translate: [number, number] = DEFAULT_ZOOM_TRANSLATE

	/**
	 * The current scale
	 */
	public scale = DEFAULT_ZOOM_SCALE

	/**
	 * The element into which the network navigator is loaded
	 */
	private element: GraphElement

	/**
	 * A div containing the svg
	 */
	private svgContainer: HTMLElement

	/**
	 * The svg element of the visualization
	 */
	private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

	/**
	 * The main visual group inside the svg
	 */
	private vis: d3.Selection<SVGGElement, unknown, null, undefined>

	/**
	 * The D3 force simulation (replaces D3 v3 force layout)
	 */
	private simulation: d3.Simulation<any, any>

	/**
	 * The forceLink force — stored separately so links can be updated independently
	 */
	private forceLink: d3.ForceLink<any, any>

	/**
	 * The D3 zoom behavior
	 */
	private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>

	/**
	 * The raw graph data given to network navigator
	 */
	private graph?: INetworkNavigatorData<INetworkNavigatorNode>

	/**
	 * The dimensions of network navigator
	 */
	private _dimensions: { width: number; height: number }

	/**
	 * The currently selected node
	 */
	private _selectedNode?: INetworkNavigatorNode

	/**
	 * The raw configuration for network navigator
	 */
	private _configuration: VisualSettings = new VisualSettings()

	/**
	 * When set, only these node names are "active"; all others are dimmed.
	 * Undefined means no external highlight is active (all nodes fully opaque).
	 */
	private _highlightedNodeNames?: Set<string>

	/**
	 * Constructor for the network navigator
	 */
	constructor(element: HTMLElement, width = 500, height = 500) {
		this.element = new GraphElement()
		element.appendChild(this.element.graphTemplate)

		this.svgContainer = this.element.svgContainer

		// × inside the search box: clear text filter only
		this.element.clearSelection.addEventListener('click', () => {
			this.textFilter = ''
		})

		// "Clear Selection" button below the search box: deselect node and lift cross-filter
		this.element.clearSelectionBtn.addEventListener('click', () => {
			this.updateSelection(undefined)
		})

		const handleTextInput = debounce(() => {
			this.filterNodes(this.element.textFilter)
		}, 500)

		this.element.filterBox.addEventListener('input', handleTextInput)
		this._dimensions = { width, height }

		this.svg = d3
			.select(this.svgContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height)

		// forceLink is stored separately from the simulation so we can call
		// forceLink.links([]) and forceLink.distance/strength without recreating it.
		this.forceLink = d3
			.forceLink<any, any>()
			.distance(10)
			.strength(2)

		// Simulation is stopped immediately — renderGraph starts it (animated mode)
		// or drives it manually via tick() (static mode).
		// forceX/forceY give each node a per-node radial pull toward the viewport
		// center — the D3 v7 equivalent of D3 v3's gravity parameter. forceCenter
		// (D3 v7) only translates the global mean and does NOT keep clusters in place.
		this.simulation = d3
			.forceSimulation<any>()
			.force('link', this.forceLink)
			// distanceMax caps repulsion range: nodes >200px apart don't push each other.
			// This keeps intra-cluster spacing (charge -120) while preventing distant
			// clusters from repelling each other across the canvas.
			.force('charge', d3.forceManyBody<any>().strength(-120).distanceMax(200))
			.force('x', d3.forceX<any>(width / 2).strength(0.1))
			.force('y', d3.forceY<any>(height / 2).strength(0.1))
			.stop()

		this.vis = this.svg.append('svg:g')
		this.redraw()
	}

	/**
	 * Sets the current text filter
	 */
	public set textFilter(value: string) {
		if (value !== this.element.textFilter) {
			this.element.filterBox.value = value
			this.filterNodes(value)
		}
	}

	/**
	 * Returns the dimensions of this network navigator
	 */
	public get dimensions() {
		return this._dimensions
	}

	/**
	 * Setter for the dimensions
	 */
	public set dimensions(newDimensions) {
		this._dimensions = {
			width: newDimensions?.width || this.dimensions.width,
			height: newDimensions?.height || this.dimensions.height,
		}

		if (this.simulation) {
			const { width, height } = this._dimensions
			;(this.simulation.force('x') as d3.ForceX<any>)?.x(width / 2)
			;(this.simulation.force('y') as d3.ForceY<any>)?.y(height / 2)

			const style = (el: HTMLElement) => {
				el.style.width = `${width}px`
				el.style.height = `${height}px`
			}
			style(this.element.graphTemplate)
			style(this.svgContainer)
			this.svg.attr('width', width).attr('height', height)
		}
	}

	/**
	 * Getter for the configuration
	 */
	public get configuration(): VisualSettings {
		return this._configuration
	}

	/**
	 * Setter for the configuration
	 */
	public set configuration(newConfig: VisualSettings) {
		if (this.simulation) {
			let runStart = false

			const getRangeValue = (
				settingName: string,
				name: string,
				config: { default: number; min: number; max: number },
			): number => {
				const { default: defaultValue, min, max } = config
				let newValue = max
					? Math.min(<number>(newConfig as any)[settingName][name], max)
					: (newConfig as any)[settingName][name]
				return (
					(min ? Math.max(<number>newValue, min) : newValue) || defaultValue
				)
			}

			const updateForceConfig = (
				settingName: keyof VisualSettings,
				name: keyof INetworkNavigatorConfiguration,
				config: { default: number; min: number; max: number },
			) => {
				if (
					(newConfig as any)[settingName][name] !==
					(this._configuration as any)[settingName][name]
				) {
					const newValue = getRangeValue(settingName, name as string, config)
					;(newConfig as any)[settingName][name] = newValue
					return true
				}
				return false
			}

			// Update linkDistance
			if (updateForceConfig('layout', 'linkDistance', linkDistance)) {
				this.forceLink.distance(newConfig.layout.linkDistance)
				runStart = true
			}
			// Update linkStrength
			if (updateForceConfig('layout', 'linkStrength', linkStrength)) {
				this.forceLink.strength(newConfig.layout.linkStrength)
				runStart = true
			}
			// Update charge (preserve distanceMax so clusters don't repel across canvas)
			if (updateForceConfig('layout', 'charge', charge)) {
				;(this.simulation.force('charge') as d3.ForceManyBody<any>)
					?.strength(newConfig.layout.charge)
					.distanceMax(200)
				runStart = true
			}
			// Update gravity (forceX/forceY strength — per-node pull toward center)
			if (updateForceConfig('layout', 'gravity', gravity)) {
				;(this.simulation.force('x') as d3.ForceX<any>)?.strength(
					newConfig.layout.gravity,
				)
				;(this.simulation.force('y') as d3.ForceY<any>)?.strength(
					newConfig.layout.gravity,
				)
				runStart = true
			}

			// Update zoom extents
			if (
				((newConfig.layout.minZoom && newConfig.layout.minZoom) !==
					this._configuration.layout.minZoom ||
					(newConfig.layout.maxZoom && newConfig.layout.maxZoom) !==
						this._configuration.layout.maxZoom) &&
				this.zoom
			) {
				this.zoom.scaleExtent([
					newConfig.layout.minZoom,
					newConfig.layout.maxZoom,
				])
			}

			if (
				this._configuration.layout.maxNodeCount !==
				newConfig.layout.maxNodeCount
			) {
				newConfig.layout.maxNodeCount = getRangeValue(
					'layout',
					'maxNodeCount',
					nodeCount,
				)
			}

			if (newConfig.layout.animate) {
				if (!this._configuration.layout.animate) {
					// Transition from static to animated
					this.simulation.alpha(1).restart()
				} else if (runStart) {
					this.simulation.alpha(0.3).restart()
				}
			} else {
				this.simulation.stop()
				if (runStart) {
					this.reflow(
						this.vis.selectAll<SVGLineElement, any>('.link'),
						this.vis.selectAll<SVGGElement, any>('.node'),
					)
				}
			}

			// Toggle labels visibility
			if (newConfig.layout.labels !== this._configuration.layout.labels) {
				this.vis
					.selectAll('.node text')
					.style('display', newConfig.layout.labels ? '' : 'none')
			}

			if (
				newConfig.search.caseInsensitive !==
				this._configuration.search.caseInsensitive
			) {
				this.filterNodes(this.element.filterBox.value ?? '')
			}

			if (
				newConfig.layout.fontSizePT !== this._configuration.layout.fontSizePT
			) {
				newConfig.layout.fontSizePT = newConfig.layout.fontSizePT || 8
				this.vis
					.selectAll('.node text')
					.attr('font-size', `${newConfig.layout.fontSizePT}pt`)
			}
		}

		this._configuration = newConfig
		this.events.raiseEvent('visualSettingsChanged', newConfig)
	}

	/**
	 * Sets the selected node
	 */
	public set selectedNode(n: INetworkNavigatorNode | undefined) {
		if (this._selectedNode !== n) {
			if (this._selectedNode) {
				this._selectedNode.selected = false
			}
			this._selectedNode = n
			if (n) {
				n.selected = true
			}
			this.redrawSelection()
		}
	}

	/**
	 * Gets the currently selected node
	 */
	public get selectedNode(): INetworkNavigatorNode | undefined {
		return this._selectedNode
	}

	/**
	 * Redraws the force network navigator
	 */
	public redraw() {
		this.renderGraph()
		this.zoomToViewport()
	}

	/**
	 * Renders the graph to the user
	 */
	public renderGraph() {
		if (this.graph) {
			const graph = this.graph
			const me = this

			this.renderZoom()
			const bilinks = this.buildBilinks(this.graph)

			// Drag behavior — v7 API: (event, datum) replaces global d3.event
			const drag = d3
				.drag<SVGGElement, any>()
				.on('start', function (event: any, d: any) {
					event.sourceEvent.stopPropagation()
					d3.select(this).classed('dragging', true)
					if (me._configuration.layout.animate) {
						if (!event.active) me.simulation.alphaTarget(0.3).restart()
					}
					d.fx = d.x
					d.fy = d.y
				})
				.on('drag', function (event: any, d: any) {
					d.fx = d.x = event.x
					d.fy = d.y = event.y
					if (!me._configuration.layout.animate) {
						tick()
					}
				})
				.on('end', function (event: any, d: any) {
					d3.select(this).classed('dragging', false)
					if (me._configuration.layout.animate) {
						if (!event.active) me.simulation.alphaTarget(0)
						d.fx = null
						d.fy = null
					}
				})

			this.svg.remove()

			this.svg = d3
				.select(this.svgContainer)
				.append('svg')
				.attr('width', this.dimensions.width)
				.attr('height', this.dimensions.height)
				.attr('preserveAspectRatio', 'xMidYMid meet')
				.attr('pointer-events', 'all')
				.classed('networkNavigator', true)
				.call(this.zoom)
			this.vis = this.svg.append<SVGGElement>('svg:g')

			if (this._configuration.layout.animate) {
				this.simulation.alpha(1).restart()
			}

			const edgeColorWeightDomain = determineDomain(
				bilinks,
				(b: any) => b[4],
				this._configuration.layout.minEdgeColorWeight,
				this._configuration.layout.maxEdgeColorWeight,
			)

			const edgeWidthDomain = determineDomain(
				bilinks,
				(b: any) => b[3],
				this._configuration.layout.minEdgeWeight,
				this._configuration.layout.maxEdgeWeight,
			)

			// D3 v7: d3.scaleLinear() replaces d3.scale.linear()
			const edgeColorScale = d3
				.scaleLinear<string>()
				.domain(edgeColorWeightDomain)
				.range([
					this._configuration.layout.edgeStartColor,
					this._configuration.layout.edgeEndColor,
				])
				.interpolate(d3.interpolateRgb)

			const edgeWidthScale = d3
				.scaleLinear<number>()
				.domain(edgeWidthDomain)
				.range([
					this._configuration.layout.edgeMinWidth,
					this._configuration.layout.edgeMaxWidth,
				])

			const domainBound = (v: number, domain: [number, number]) =>
				Math.min(domain[1], Math.max(domain[0], v))

			const xform = (
				v: number,
				scale: (v: number) => any,
				domain: [number, number],
				defaultValue: any,
			) => {
				const isValuePresent = v !== undefined
				const boundedValue = isValuePresent ? domainBound(v, domain) : v
				return isValuePresent ? scale(boundedValue) : defaultValue
			}

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
				.attr('d', 'M0,-5L10,0L0,5')

			const link = this.vis
				.selectAll('.link')
				.data(bilinks)
				.enter()
				.append('line')
				.attr('class', 'link')
				.style('stroke', (d: any) =>
					// d[5] is a direct CSS color string — use it if present, else fall back to gradient
					d[5] || xform(d[4], edgeColorScale, edgeColorWeightDomain, 'gray'),
				)
				.style('stroke-width', (d: any) =>
					xform(d[3], edgeWidthScale, edgeWidthDomain, DEFAULT_EDGE_SIZE),
				)
				.attr('id', (d: any) =>
					d[0].name.replace(/\./g, '_').replace(/@/g, '_') +
					'_' +
					d[2].name.replace(/\./g, '_').replace(/@/g, '_'),
				)

			const node = this.vis
				.selectAll<SVGGElement, any>('.node')
				.data(graph.nodes)
				.enter()
				.append('g')
				.call(drag)
				.attr('class', 'node')

			node.append('svg:circle')
				.attr('r', (d: any) => {
					let width = d.value
					if (typeof width === 'undefined' || width === null) {
						width = DEFAULT_NODE_SIZE
					}
					const maxSize = this._configuration.layout.maxNodeSize
					const minSize = this._configuration.layout.minNodeSize
					width = maxSize && width > maxSize ? maxSize : width
					width = minSize && width < minSize ? minSize : width
					return width > 0 ? width : 0
				})
				.style('fill', (d: any) => d.color)
				.style('stroke', 'red')
				.style('stroke-width', (d: any) => (d.selected ? 1 : 0))
				.style('opacity', (d: any) => (d.dimmed ? 0.2 : 1.0))

			// D3 v7: event is first argument, datum is second
			node.on('click', (_event: MouseEvent, n: INetworkNavigatorNode) =>
				this.updateSelection(n),
			)

			// When labels are off: show the hovered node's label, hide on mouseout
			node.on('mouseover', function() {
				d3.select(this).select('text').style('display', '')
			})
			node.on('mouseout', function() {
				if (!me._configuration.layout.labels) {
					d3.select(this).select('text').style('display', 'none')
				}
			})

			node.append('svg:text')
				.attr('class', 'node-label')
				.text((d: any) => d.name)
				.attr(
					'fill',
					(d: any) =>
						d.labelColor || this._configuration.layout.defaultLabelColor,
				)
				.attr('font-size', `${this._configuration.layout.fontSizePT}pt`)
				.style('opacity', (d: any) => (d.dimmed ? 0.2 : 1.0))
				.style('display', this._configuration.layout.labels ? null : 'none')

			if (!this._configuration.layout.animate) {
				this.reflow(link, node)
			}

			// Tick function: update SVG positions from simulation node x/y
			const tick = () => {
				if (this._configuration.layout.animate) {
					link.attr('x1', (d: any) => d[0].x)
						.attr('y1', (d: any) => d[0].y)
						.attr('x2', (d: any) => d[2].x)
						.attr('y2', (d: any) => d[2].y)
					node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
				}
			}

			// D3 v7: 'tick' fires on the simulation object, not the force layout
			this.simulation.on('tick', tick)
		}
	}

	private buildBilinks(
		graph?: INetworkNavigatorData<INetworkNavigatorNode>,
	): any[] {
		const nodes = graph.nodes.slice()
		const links: { source: any; target: any }[] = []
		const bilinks: any[] = []

		// Bilink technique: for each logical edge s→t we insert a hidden intermediate
		// node `i` and two real force links: s→i and i→t. The SVG line is drawn
		// from s to t using i's position as an invisible midpoint anchor. This lets
		// parallel edges between the same two nodes curve without overlapping.
		// bilinks[k] = [sourceNode, intermediateNode, targetNode, edgeWidth, edgeColor]
		graph.links.forEach(graphLink => {
			const s = nodes[graphLink.source]
			const t = nodes[graphLink.target]
			const w = graphLink.value
			const cw = graphLink.colorValue
			const dc = graphLink.directColor
			const i: any = {}
			nodes.push(i)
			links.push({ source: s, target: i }, { source: i, target: t })
			// bilinks[k] = [sourceNode, intermediateNode, targetNode, edgeWidth, edgeColorWeight, directColor]
			bilinks.push([s, i, t, w, cw, dc])
		})

		// D3 v7: set nodes on simulation, links on forceLink
		this.simulation.nodes(nodes)
		this.forceLink.links(links)
		return bilinks
	}

	public resetZoom() {
		this.scale = DEFAULT_ZOOM_SCALE
		this.translate = DEFAULT_ZOOM_TRANSLATE
		this.zoomToViewport()
	}

	private renderZoom() {
		// event.transform.k = scale, event.transform.x/y = translate.
		// We store scale/translate so zoomToViewport() can restore them after a redraw.
		this.zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([
				this._configuration.layout.minZoom,
				this._configuration.layout.maxZoom,
			])
			.on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
				this.scale = event.transform.k
				this.translate = [event.transform.x, event.transform.y]
				if (this.vis) {
					this.vis.attr('transform', event.transform.toString())
				}
			})
	}

	/**
	 * Applies the current scale and translate settings to the view.
	 */
	private zoomToViewport() {
		if (this.zoom && this.vis && this.svg) {
			this.vis.attr(
				'transform',
				`translate(${this.translate}) scale(${this.scale})`,
			)
			// In D3 v7, zoom.transform() is how you programmatically set the zoom
			// state. Calling it syncs the behavior's internal __zoom property on the
			// SVG element so that subsequent user gestures start from the right baseline
			// rather than snapping back to identity.
			this.svg.call(
				this.zoom.transform,
				d3.zoomIdentity
					.translate(this.translate[0], this.translate[1])
					.scale(this.scale),
			)
		}
	}

	/**
	 * Gets the data associated with this graph
	 */
	public get data(): INetworkNavigatorData<INetworkNavigatorNode> {
		return this.graph
	}

	/**
	 * Sets the data for this force graph
	 */
	public set data(graph: INetworkNavigatorData<INetworkNavigatorNode>) {
		this.graph = graph
		this.redraw()
	}

	/**
	 * Redraws the selections on the nodes
	 */
	public redrawSelection() {
		this.vis
			.selectAll('.node circle')
			.style('stroke-width', (d: any) => (d.selected ? 1 : 0))
	}

	/**
	 * Sets highlight mode for bi-directional cross-filtering.
	 * @param highlightedNodeNames Set of node names that should remain fully opaque.
	 *   Pass undefined to clear highlight mode (all nodes fully opaque).
	 */
	public setHighlightMode(highlightedNodeNames?: Set<string>) {
		this._highlightedNodeNames = highlightedNodeNames
		const nodes = this.graph?.nodes
		if (nodes) {
			nodes.forEach(n => {
				n.dimmed =
					highlightedNodeNames !== undefined &&
					!!n.name &&
					!highlightedNodeNames.has(n.name)
			})
		}
		this.redrawHighlights()
	}

	/**
	 * Redraws node and label opacity to reflect the current highlight/dim state.
	 */
	public redrawHighlights() {
		this.vis
			.selectAll('.node circle')
			.style('opacity', (d: any) => (d.dimmed ? 0.2 : 1.0))
		this.vis
			.selectAll('.node .node-label')
			.style('opacity', (d: any) => (d.dimmed ? 0.2 : 1.0))
		this.vis
			.selectAll('.link')
			.style('opacity', (d: any) =>
				d[0]?.dimmed && d[2]?.dimmed ? 0.1 : 0.8,
			)
	}

	/**
	 * Redraws the node labels
	 */
	public redrawLabels() {
		this.vis
			.selectAll('.node .node-label')
			.attr(
				'fill',
				(d: any) =>
					d.labelColor || this._configuration.layout.defaultLabelColor,
			)
	}

	/**
	 * Filters the nodes to the given string
	 */
	public filterNodes(text: string, animate = true) {
		let temp: any = this.vis.selectAll('.node circle')
		if (animate) {
			temp = temp.transition().duration(500).delay(100)
		}
		const pretty = (val: string) => (val || '') + ''
		temp.attr('transform', (d: any) => {
			let scale = 1
			const searchStr = d.name || ''
			const flags = this._configuration.search.caseInsensitive ? 'i' : ''
			const regex = new RegExp(escapeRegExp(text), flags)
			if (text && regex.test(pretty(searchStr))) {
				scale = 3
			}
			return `scale(${scale})`
		})
	}

	/**
	 * Updates the selection based on the given node
	 */
	public updateSelection(n?: INetworkNavigatorNode) {
		let selectedNode = n
		if (n !== this._selectedNode) {
			if (this._selectedNode) {
				this._selectedNode.selected = false
			}
			if (n) {
				n.selected = true
			}
		} else {
			// Toggle: clicking the already-selected node deselects it
			if (this._selectedNode) {
				this._selectedNode.selected = false
			}
			selectedNode = undefined
		}
		this.selectedNode = selectedNode
		this.events.raiseEvent('selectionChanged', this._selectedNode)
	}

	/**
	 * Reflows the given links and nodes using manual simulation ticks (no animation timer)
	 */
	private reflow(
		link: d3.Selection<any, any, any, any>,
		node: d3.Selection<any, any, any, any>,
	) {
		// Static (non-animated) layout: advance the simulation synchronously instead
		// of letting the internal timer run. alpha() decays each tick; we stop early
		// if it drops below 0.01 (essentially converged). 150 iterations is a safe
		// upper bound for typical graph sizes.
		this.simulation.alpha(1).stop()
		for (let k = 0; k < 150 && this.simulation.alpha() > 1e-2; k++) {
			this.simulation.tick()
		}
		this.createConnections(link, node)
	}

	private createConnections(
		link: d3.Selection<any, any, any, any>,
		node: d3.Selection<any, any, any, any>,
	) {
		link.attr('x1', (d: any) => d[0].x)
			.attr('y1', (d: any) => d[0].y)
			.attr('x2', (d: any) => d[2].x)
			.attr('y2', (d: any) => d[2].y)
		node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
	}
}
