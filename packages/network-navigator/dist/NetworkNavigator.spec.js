"use strict";
/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const $ = require("jquery");
const VisualSettings_1 = require("./VisualSettings");
const NetworkNavigator_1 = require("./NetworkNavigator");
describe('NetworkNavigator', () => {
    let parentEle;
    beforeEach(() => {
        parentEle = $('<div></div>');
    });
    afterEach(() => {
        if (parentEle) {
            parentEle.remove();
        }
        parentEle = undefined;
    });
    const createInstance = () => {
        const ele = $('<div></div>');
        parentEle.append(ele);
        const visualSettings = new VisualSettings_1.VisualSettings();
        visualSettings.layout.animate = false;
        const result = {
            instance: new NetworkNavigator_1.NetworkNavigator(ele),
            element: ele,
        };
        result.instance.configuration = visualSettings;
        return result;
    };
    const performClick = (node) => {
        let evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        node.dispatchEvent(evt);
    };
    /**
     * Performs a drag operation on the given node
     */
    const performDrag = (node, delta) => {
        let evt = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 0,
            screenX: 10,
            screenY: 10,
            clientX: 10,
            clientY: 10,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 1,
            relatedTarget: node,
        });
        node.dispatchEvent(evt);
        evt = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 0,
            screenX: 10 + delta,
            screenY: 10 + delta,
            clientX: 10 + delta,
            clientY: 10 + delta,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 1,
            relatedTarget: node,
        });
        window.dispatchEvent(evt);
        evt = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 0,
            screenX: 10 + delta,
            screenY: 10 + delta,
            clientX: 10 + delta,
            clientY: 10 + delta,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 1,
            relatedTarget: node,
        });
        window.dispatchEvent(evt);
    };
    const performZoom = (node, delta) => {
        let evt = new WheelEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: delta,
            clientY: delta,
        });
        node.dispatchEvent(evt);
    };
    const performZoomPan = (node, zoomDelta, panDelta) => {
        performZoom(node, zoomDelta);
        performDrag(node, panDelta);
    };
    const getRootGraphElement = () => {
        return parentEle.find('svg');
    };
    it('should load', () => {
        createInstance();
    });
    const oneSourceTwoTargets = {
        nodes: [
            { selected: false, name: 'SOURCE_NODE' },
            { selected: false, name: 'TARGET_NODE_1' },
            { selected: false, name: 'TARGET_NODE_2' },
        ],
        links: [
            {
                source: 0,
                target: 1,
            },
            {
                source: 0,
                target: 2,
            },
        ],
    };
    describe('redrawLabels', () => {
        it('should default the label colors to the color in the configuration', () => {
            const { element, instance } = createInstance();
            const color = '#123456';
            instance.data = oneSourceTwoTargets;
            instance.configuration = Object.assign(Object.assign({}, instance.configuration), { layout: Object.assign(Object.assign({}, instance.configuration.layout), { defaultLabelColor: color }) });
            instance.redrawLabels();
            const labels = element.find('.node .node-label');
            const colors = labels.map((i, ele) => $(ele).attr('fill')).toArray();
            const expected = oneSourceTwoTargets.nodes.map(n => color);
            (0, chai_1.expect)(colors).to.be.deep.equal(expected);
        });
        it('should correctly assign label colors to the correct nodes', () => {
            const { element, instance } = createInstance();
            const baseColor = '#12345';
            const myData = {
                links: oneSourceTwoTargets.links.slice(0),
                nodes: oneSourceTwoTargets.nodes.slice(0).map(n => {
                    return $.extend(true, {}, n);
                }),
            };
            instance.configuration = Object.assign(Object.assign({}, instance.configuration), { layout: Object.assign(Object.assign({}, instance.configuration.layout), { defaultLabelColor: 'purple' }) });
            instance.data = myData;
            // Tweak the node colors AFTER we set the data into NetworkNavigator
            myData.nodes.map((n, i) => {
                n.labelColor = baseColor + i;
            });
            // Tell it to rerender the labels
            instance.redrawLabels();
            const labels = element.find('.node .node-label');
            const colors = labels.map((i, ele) => $(ele).attr('fill')).toArray();
            // Basically the nodes have colors in the format: #12345<index>, so node at index 0
            // will have the color #123450
            const expected = myData.nodes.map((n, i) => n.labelColor);
            (0, chai_1.expect)(colors).to.be.deep.equal(expected);
        });
    });
    describe('filterNodes', () => {
        const testFilters = (instance, element, text, matches) => {
            // Set the filter to highlight nodes with "TARGET" in their name
            instance.filterNodes(text, false);
            // The 3 nodes
            const nodes = element.find('.node');
            (0, chai_1.expect)(nodes.length).to.eq(3);
            const highlightedNodes = nodes.filter((i, node) => {
                const trans = $(node).find('circle').attr('transform');
                return trans && trans.indexOf('scale(3)') >= 0;
            });
            const texts = [];
            highlightedNodes.each((i, node) => {
                const textNode = $(node).find('text')[0];
                texts.push(textNode.innerHTML || textNode.textContent);
            });
            (0, chai_1.expect)(texts).to.deep.equal(matches);
        };
        it('should visibly change nodes when they match a search string', () => {
            const { instance, element } = createInstance();
            // Set that datas
            instance.data = oneSourceTwoTargets;
            testFilters(instance, element, 'TARGET', [
                'TARGET_NODE_1',
                'TARGET_NODE_2',
            ]);
        });
        it('should visibly change nodes when the search string has changed', () => {
            const { instance, element } = createInstance();
            // Set that datas
            instance.data = oneSourceTwoTargets;
            // Set the first
            testFilters(instance, element, 'TARGET', [
                'TARGET_NODE_1',
                'TARGET_NODE_2',
            ]);
            // Set the second
            testFilters(instance, element, 'SOURCE', ['SOURCE_NODE']);
        });
        it('should visibly change nodes when the search string has changed back to nothing', () => {
            const { instance, element } = createInstance();
            // Set that datas
            instance.data = oneSourceTwoTargets;
            // Set the first
            testFilters(instance, element, 'TARGET', [
                'TARGET_NODE_1',
                'TARGET_NODE_2',
            ]);
            // Set the second
            testFilters(instance, element, '', []);
        });
    });
    describe('graph', () => {
        it('should show 3 nodes, when there is a source and two targets', () => {
            const { instance, element } = createInstance();
            // Set that datas
            instance.data = oneSourceTwoTargets;
            // The 3 nodes
            (0, chai_1.expect)(element.find('circle').length).to.eq(3);
        });
        it('should show two connections, when there is a source and two targets', () => {
            const { instance, element } = createInstance();
            // Set that datas
            instance.data = oneSourceTwoTargets;
            // The 2 links
            (0, chai_1.expect)(element.find('.link').length).to.eq(2);
        });
        it('should limit max vertex size', () => {
            const { instance, element } = createInstance();
            instance.configuration = Object.assign(Object.assign({}, instance.configuration), { layout: Object.assign(Object.assign({}, instance.configuration.layout), { maxNodeSize: 5 }) });
            instance.data = oneSourceTwoTargets;
            const values = [];
            element.find('circle').each(function () {
                values.push(parseInt($(this).attr('r')));
            });
            (0, chai_1.expect)(values).to.be.deep.equal([5, 5, 5]);
        });
        it('should limit min vertex size', () => {
            const { instance, element } = createInstance();
            instance.configuration = Object.assign(Object.assign({}, instance.configuration), { layout: Object.assign(Object.assign({}, instance.configuration.layout), { minNodeSize: 100 }) });
            instance.data = oneSourceTwoTargets;
            const values = [];
            element.find('circle').each(function () {
                values.push(parseInt($(this).attr('r')));
            });
            (0, chai_1.expect)(values).to.be.deep.equal([100, 100, 100]);
        });
    });
    it('should default the label colors to the color in the configuration', () => {
        const { element, instance } = createInstance();
        const color = '#123456';
        instance.configuration = Object.assign(Object.assign({}, instance.configuration), { layout: Object.assign(Object.assign({}, instance.configuration.layout), { defaultLabelColor: color }) });
        instance.data = oneSourceTwoTargets;
        const labels = element.find('.node .node-label');
        const colors = labels.map((i, ele) => $(ele).attr('fill')).toArray();
        const expected = oneSourceTwoTargets.nodes.map(n => color);
        (0, chai_1.expect)(colors).to.be.deep.equal(expected);
    });
    it('should correctly assign label colors to the correct nodes', () => {
        const { element, instance } = createInstance();
        const baseColor = '#12345';
        const myData = {
            links: oneSourceTwoTargets.links.slice(0),
            nodes: oneSourceTwoTargets.nodes.map((n, i) => {
                return $.extend(true, {}, n, {
                    labelColor: baseColor + i,
                });
            }),
        };
        instance.data = myData;
        const labels = element.find('.node .node-label');
        const colors = labels.map((i, ele) => $(ele).attr('fill')).toArray();
        // Basically the nodes have colors in the format: #12345<index>, so node at index 0
        // will have the color #123450
        const expected = myData.nodes.map((n, i) => n.labelColor);
        (0, chai_1.expect)(colors).to.be.deep.equal(expected);
    });
    // it("should zoom in when mousewheeled in", () => {
    //   const { instance } = createInstance();
    //   // Set that datas
    // instance.data = oneSourceTwoTargets;
    //   const svgEle = getRootGraphElement();
    //   performZoom(svgEle[0], 1000);
    //   const transform = svgEle.find("g").attr("transform");
    //   const regex = /scale\(([\d.]+)\)/;
    //   expect(regex.test(transform)).to.be.true;
    //   expect(parseFloat(regex.exec(transform)[1])).to.be.greaterThan(1);
    // });
    // it("should zoom in when mousewheeled out", () => {
    //   const { instance } = createInstance();
    //   // Set that datas
    // instance.data = oneSourceTwoTargets;
    //   const svgEle = getRootGraphElement();
    //   performZoom(svgEle[0], -1000);
    //   const transform = svgEle.find("g").attr("transform");
    //   const regex = /scale\(([\d.]+)\)/;
    //   expect(regex.test(transform)).to.be.true;
    //   expect(parseFloat(regex.exec(transform)[1])).to.be.lessThan(1);
    // });
    it('should pan when dragged on', () => {
        const { instance, element } = createInstance();
        // Set that datas
        instance.data = oneSourceTwoTargets;
        const svgEle = getRootGraphElement();
        performDrag(svgEle[0], -1000);
        const transform = svgEle.find('g').attr('transform');
        (0, chai_1.expect)(transform.indexOf('translate(-1000,-1000)') >= 0).to.equal(true, 'should pan when dragged on');
    });
    it('should move the nodes when the nodes are dragged on', () => {
        const { instance, element } = createInstance();
        instance.configuration = Object.assign(Object.assign({}, instance.configuration), { layout: Object.assign(Object.assign({}, instance.configuration.layout), { animate: true }) });
        // Set that datas
        instance.data = oneSourceTwoTargets;
        const nodeEle = element.find('svg .node');
        performDrag(nodeEle[0], 100000);
        const transform = nodeEle.attr('transform');
        const regex = /translate\(([\d\.]+),[\d\.]+\)/;
        // 2000 delta because force graph changes the precise location a bit
        (0, chai_1.expect)(parseFloat(regex.exec(transform)[1])).to.be.closeTo(100000, 2000);
    });
    const selectTest = () => {
        const { instance, element } = createInstance();
        // Set that datas
        instance.data = oneSourceTwoTargets;
        const singleNode = element.find('svg .node').first();
        performClick(singleNode[0]);
        return { instance, element, singleNode };
    };
    it('should deselect the node if the same node is selected twice', () => {
        const { instance, singleNode } = selectTest();
        const selectedNodeName = singleNode.text().trim();
        performClick(singleNode[0]);
        const selected = instance.data.nodes.find(d => d.selected);
        (0, chai_1.expect)(selected === null || selected === void 0 ? void 0 : selected.name).to.not.be.eq(selectedNodeName);
    });
    it('should set the selected properly correctly', () => {
        const { instance, singleNode } = selectTest();
        const selectedNodeName = singleNode.text().trim();
        const selected = instance.data.nodes.find(d => d.selected);
        (0, chai_1.expect)(selected.name).to.be.eq(selectedNodeName);
    });
    it('should deselect the first node if the a second node is selected', () => {
        const { instance, element } = createInstance();
        instance.data = oneSourceTwoTargets;
        const nodeOne = $(element.find('svg .node')[0]);
        const nodeTwo = $(element.find('svg .node')[1]);
        const selectedNodeName = nodeTwo.text().trim();
        // Click on the first, then the second node
        performClick(nodeOne[0]);
        performClick(nodeTwo[0]);
        // Everything should be deselected since we toggled the same node
        instance.data.nodes.forEach(n => {
            (0, chai_1.expect)(n.selected).to.be.eq(n.name === selectedNodeName);
        });
    });
    it('should set the height of the svg when dimensions have been changed', () => {
        const { instance } = createInstance();
        instance.dimensions = { width: 260, height: 245 };
        instance.data = oneSourceTwoTargets;
        (0, chai_1.expect)(getRootGraphElement().attr('height')).to.be.deep.equal('245');
        instance.dimensions = { width: 123, height: 643 };
        (0, chai_1.expect)(getRootGraphElement().attr('height')).to.be.deep.equal('643');
    });
    it('should set the height of the svg when dimensions have been changed', () => {
        const { instance } = createInstance();
        instance.dimensions = { width: 260, height: 245 };
        instance.data = oneSourceTwoTargets;
        (0, chai_1.expect)(getRootGraphElement().attr('width')).to.be.deep.equal('260');
        instance.dimensions = { width: 123, height: 245 };
        (0, chai_1.expect)(getRootGraphElement().attr('width')).to.be.deep.equal('123');
    });
    // it("should restore the correct zoom/pan after a redraw", () => {
    //   const { instance, element } = createInstance();
    //   instance.dimensions = { width: 260, height: 245 };
    //   // Load it the first time
    //   instance.data = oneSourceTwoTargets;
    //   // Perform the original pan/zoom
    //   let svgEle = getRootGraphElement();
    //   performZoomPan(svgEle[0], 2000, 2000);
    //   // Get the current transformation
    //   let graph = element.find("svg > g");
    //   const originalTransform = graph.attr("transform");
    //   // Tell our instance to redraw iteself
    //   instance.redraw();
    //   // Perform another "fake" drag/zoom operation
    //   svgEle = getRootGraphElement();
    //   performZoomPan(svgEle[0], 0, 0);
    //   // Get the new transform
    //   graph = element.find("svg > g");
    //   expect(graph.length).to.be.eq(1);
    //   const transform = graph.attr("transform");
    //   // Since we didn't actually pan/zoom anywhere (but faked it), the transforms should be the same
    //   expect(transform).to.be.equal(originalTransform);
    // });
});
//# sourceMappingURL=NetworkNavigator.spec.js.map