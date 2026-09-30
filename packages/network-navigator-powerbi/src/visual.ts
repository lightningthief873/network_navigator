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
'use strict'

import 'core-js/stable'
import * as $ from 'jquery'
import powerbi from 'powerbi-visuals-api'
import converter from './configs/converter'
import { DATA_ROLES } from './configs/DATA_ROLES'
import { pretty } from './pretty'
import './style/visual.less'
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions
import IVisual = powerbi.extensibility.visual.IVisual
import IVisualHost = powerbi.extensibility.visual.IVisualHost
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions
import VisualObjectInstance = powerbi.VisualObjectInstance
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject

import { NetworkNavigator, VisualSettings } from '@essex/network-navigator'
import debounce from 'lodash-es/debounce'
import get from 'lodash-es/get'
import { INetworkNavigatorSelectableNode } from './configs/models'

const EVENTS_TO_IGNORE =
	'mousedown mouseup click focus blur input pointerdown pointerup touchstart touchmove touchdown'

const target = '<div style="height: 100%;"></div>'
// 254 is a Misc type not documented and not explained by powerbi
const DATA_CHANGED_TYPES = [
	powerbi.VisualUpdateType.Data,
	powerbi.VisualUpdateType.All,
	254,
]

//enum 36 is not documented but is a combination of resize and resizeEnd: https://github.com/Microsoft/PowerBI-visuals-tools/issues/83
const DATA_RESIZE = [
	powerbi.VisualUpdateType.Resize,
	powerbi.VisualUpdateType.ResizeEnd,
	powerbi.VisualUpdateType.ViewMode,
	powerbi.VisualUpdateType.Resize + powerbi.VisualUpdateType.ResizeEnd,
]
export class Visual implements IVisual {
	/**
	 * The selection changed listener for NetworkNavigator
	 */
	private selectionChangedListener: { destroy: () => void }
	/**
	 * The selection manager, used to sync selection with PowerBI
	 */
	private selectionManager: powerbi.extensibility.ISelectionManager
	/**
	 * The visual's host
	 */
	private host: IVisualHost

	/**
	 * The currently loaded dataView
	 */
	private _dataView: powerbi.DataView

	private _dataViewTable: powerbi.DataViewTable

	/**
	 * My network navigator instance
	 */
	public networkNavigator: NetworkNavigator
	private target: JQuery
	private visualSettings: VisualSettings

	/**
	 * The last converted graph data, kept so we can map highlights back to nodes
	 */
	private _currentGraphData: ReturnType<typeof converter> | undefined

	constructor(options: VisualConstructorOptions) {
		this.host = options.host

		if (document) {
			this.target = $(target)
			options.element.appendChild(this.target[0])
		}

		this.selectionManager = this.host.createSelectionManager()

		this.visualSettings = new VisualSettings()
		this.networkNavigator = new NetworkNavigator(
			this.target,
			this.target.width(),
			this.target.height(),
		)
		this.attachEvents()

		// Inbound: when another visual makes a selection, highlight matching nodes
		this.selectionManager.registerOnSelectCallback(
			(ids: powerbi.visuals.ISelectionId[]) => {
				this.handleExternalSelection(ids)
			},
		)
	}

	public update(options: VisualUpdateOptions) {
		const dataView =
			options.dataViews &&
			options.dataViews.length &&
			options.dataViews[0]
		this._dataView = dataView
		const dataViewTable = dataView && dataView.table
		const dataChanged = this._dataViewTable !== dataViewTable
		this._dataViewTable = dataViewTable

		if (DATA_RESIZE.includes(options.type)) {
			const dimensions = {
				width: options.viewport.width,
				height: options.viewport.height,
			}
			this.networkNavigator.dimensions = dimensions
		} else if (DATA_CHANGED_TYPES.includes(options.type)) {
			this.visualSettings = VisualSettings.parse<VisualSettings>(dataView)
			this.networkNavigator.configuration = this.visualSettings
			if (dataChanged) {
				if (dataViewTable) {
					const filterColumn = dataView.metadata.columns.filter(
						n => n.roles[DATA_ROLES.filterField.name],
					)[0]

					const newData = converter(
						dataView,
						this.visualSettings,
						filterColumn,
						() => this.host.createSelectionIdBuilder(),
					)

					this._currentGraphData = newData
					this.networkNavigator.data = newData
				} else {
					this._currentGraphData = undefined
					this.networkNavigator.data = {
						links: [],
						nodes: [],
					}
				}
			}

			// Inbound cross-highlight: apply highlights sent by other visuals
			const tableHighlights = (dataView?.table as any)
				?.highlights as powerbi.PrimitiveValue[][] | undefined
			if (tableHighlights) {
				this.applyHighlights(tableHighlights)
			} else {
				this.networkNavigator.setHighlightMode(undefined)
			}
		}

		//reset the zoom if leaving focus mode
		if (
			options.type === powerbi.VisualUpdateType.ViewMode &&
			!options.isInFocus
		) {
			this.networkNavigator.resetZoom()
		}

		// Load the settings after we have loaded the nodes, cause otherwise
		this.loadSelectionFromPowerBI(dataChanged)
		this.networkNavigator.redrawLabels()
	}

	/**
	 * Destroys the visual
	 */
	public destroy() {
		this.target.empty()
	}

	/**
	 * Loads the selection state from powerbi
	 */
	private loadSelectionFromPowerBI(forceReload: boolean) {
		const data = this.networkNavigator.data
		const nodes = data && data.nodes

		// For each of the nodes, check to see if their ids are in the selection manager, and
		// mark them as selected
		if (nodes && nodes.length) {
			const filterValues = getFilterValues(
				this._dataView,
				'general.filter',
			)
			const valueMap = (filterValues || []).reduce((acc, cur) => {
				acc[cur] = 1
				return acc
			}, {})

			let selectedNode: INetworkNavigatorSelectableNode

			nodes.forEach((n: INetworkNavigatorSelectableNode) => {
				const isSelected = !!valueMap[pretty(n.name)]
				n.selected = isSelected

				// Just select the last one for now
				if (isSelected) {
					selectedNode = n
				}
			})

			if (!this.networkNavigator.selectedNode || forceReload) {
				this.networkNavigator.selectedNode = selectedNode
			}
		}
	}
	/**
	 * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
	 * objects and properties you want to expose to the users in the property pane.
	 *
	 */
	public enumerateObjectInstances(
		options: EnumerateVisualObjectInstancesOptions,
	): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
		return VisualSettings.enumerateObjectInstances(
			this.visualSettings || VisualSettings.getDefault(),
			options,
		)
	}

	/**
	 * Persists the given node as the selected node.
	 * Outbound bi-directional: broadcasts both a cross-filter (applyJsonFilter)
	 * and a cross-highlight (selectionManager.select) to other visuals.
	 */
	protected persistNodeSelection(node: INetworkNavigatorSelectableNode) {
		// Cross-highlight: dims (but doesn't filter) matching data in other visuals
		if (node && node.identity) {
			this.selectionManager
				.select([node.identity], false)
				.catch((e: unknown) => console.warn('selectionManager.select failed:', e))
		} else {
			this.selectionManager
				.clear()
				.catch((e: unknown) => console.warn('selectionManager.clear failed:', e))
		}

		// Cross-filter: actually filters data in other visuals (persistent via capabilities)
		const filterToApply = node && node.filter
		let hasConditions = false
		if (filterToApply && filterToApply['values']) {
			hasConditions = filterToApply['values'].length > 0
		} else if (filterToApply && filterToApply['conditions']) {
			hasConditions = filterToApply['conditions'].length > 0
		}
		const action = hasConditions
			? powerbi.FilterAction.merge
			: powerbi.FilterAction.remove

		this.host.applyJsonFilter(filterToApply, 'general', 'filter', action)
	}

	/**
	 * Inbound cross-highlight: called when the DataView contains highlight data
	 * sent by another visual via supportsHighlight. Maps highlighted row indices
	 * to node names and dims all non-highlighted nodes.
	 */
	private applyHighlights(highlights: powerbi.PrimitiveValue[][]) {
		const nodes = this._currentGraphData?.nodes
		if (!nodes?.length) return

		// A row is "highlighted" if at least one column value is non-null
		const highlightedRows = new Set<number>()
		highlights.forEach((rowHighlights, rowIdx) => {
			if (rowHighlights?.some(v => v !== null)) {
				highlightedRows.add(rowIdx)
			}
		})

		if (highlightedRows.size === 0) {
			this.networkNavigator.setHighlightMode(undefined)
			return
		}

		// Map highlighted rows back to node names via the rowIndices stored on each node
		const highlightedNodeNames = new Set<string>()
		nodes.forEach(n => {
			if (n.rowIndices.some(idx => highlightedRows.has(idx))) {
				highlightedNodeNames.add(n.name)
			}
		})

		this.networkNavigator.setHighlightMode(highlightedNodeNames)
	}

	/**
	 * Inbound cross-highlight: called by registerOnSelectCallback when another visual
	 * makes a selection via SelectionManager. Matches incoming IDs to our node identities
	 * and dims non-matching nodes.
	 */
	private handleExternalSelection(ids: powerbi.visuals.ISelectionId[]) {
		if (!ids || ids.length === 0) {
			this.networkNavigator.setHighlightMode(undefined)
			return
		}

		const nodes = this._currentGraphData?.nodes
		if (!nodes?.length) return

		// Build a lookup of incoming selection key → true
		const incomingKeys = new Set(ids.map(id => id.getKey()))

		// Find nodes whose identity key matches any of the incoming IDs
		const matchedNames = new Set<string>()
		nodes.forEach(n => {
			if (n.identity && incomingKeys.has(n.identity.getKey())) {
				matchedNames.add(n.name)
			}
		})

		// Only apply dimming if at least one node matched; otherwise clear
		this.networkNavigator.setHighlightMode(
			matchedNames.size > 0 ? matchedNames : undefined,
		)
	}

	/**
	 * A debounced event listener for when a node is selected through NetworkNavigator
	 */
	private onNodeSelected = debounce(
		(node: INetworkNavigatorSelectableNode) => {
			this.persistNodeSelection(node)
		},
		100,
	)

	/**
	 * Attaches the event listeners to the network navigator
	 */
	private attachEvents() {
		if (this.networkNavigator) {
			// Cleans up events
			if (this.selectionChangedListener) {
				this.selectionChangedListener.destroy()
			}
			const dispatcher = this.networkNavigator.events
			this.selectionChangedListener = dispatcher.on(
				'selectionChanged',
				(node: INetworkNavigatorSelectableNode) =>
					this.onNodeSelected(node),
			)

			dispatcher.on(
				'visualSettingsChanged',
				(settings: VisualSettings) => (this.visualSettings = settings),
			)

			// PowerBI will eat some events, so use this to prevent powerbi from eating them
			this.target
				.find('.filter-box input')
				.on(EVENTS_TO_IGNORE, e => e.stopPropagation())
		}
	}
}

function getFilterValues(dv: powerbi.DataView, filterPath: string): string[] {
	const savedFilter: any = get(dv, `metadata.objects.${filterPath}`)

	if (savedFilter) {
		return savedFilter.whereItems.map((n: any) => {
			let text = pretty(get(n, 'condition.right.value'))
			// Is an array
			if (n && n.splice) {
				text = pretty(n[0].value)
				// If we have a non empty value property
			} else if (n && n.value !== undefined && n.value !== null) {
				text = pretty(n.value)
			}

			return text
		})
	}
	return []
}
