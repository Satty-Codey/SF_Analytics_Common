// @flow
// eslint-disable-next-line no-restricted-imports
import $ from 'jquery';
import ReactDOM from 'react-dom';
import type {Component} from 'react';

/**
 * @DEPRECATED: Use native DOM APIs instead. We've mostly gotten rid of jQuery, this is the final hurdle.
 *
 * Utilities for dealing with jQuery.
 */

// $FlowFixMe[unclear-type]
type JQueryCollection = any;

// $FlowFixMe[unclear-type]
type AnyClassComponent = Component<any, any>;

/**
 * Return a jQuery element given a DOM element, css selector, jQuery element or a React component. Optionally
 * assert it is a single element.
 */
export function to$(
	element: HTMLElement | JQueryCollection | AnyClassComponent,
	ifOnlyOne: boolean = false
): JQueryCollection {
	if (element.jquery) {
		if (ifOnlyOne && element.length !== 1) {
			throw new Error('Must be a single element.');
		}

		return element;

		// undocumented field that indicates a react component
	} else if (element.isReactComponent) {
		// eslint-disable-next-line react/no-find-dom-node
		return $(ReactDOM.findDOMNode(element));
	} else {
		return $(element);
	}
}

/**
 * Return the given React component or a reference of it as a jQuery element.
 */
export function get$(component: AnyClassComponent, refName?: string): JQueryCollection {
	const cmp = refName ? component.refs[refName] : component;

	return cmp ? to$(cmp) : $();
}

/**
 * Return true if the test element is or is a child of the target element. Target and test can be either DOM or
 * jQuery elements.
 */
export function isOrIn(target: HTMLElement | JQueryCollection, test: HTMLElement | JQueryCollection): boolean {
	const target$: JQueryCollection = target.jquery ? target : $(target);
	const testEl = test.jquery ? (test: JQueryCollection)[0] : test;

	return target$.is(testEl) || target$.find(testEl).length > 0;
}
