// @flow
type NodeWithStyles = {
	node: HTMLElement,
	stylesString: ?string
};

type InlineStyle = {
	'background-color': string,
	'background-image': string,
	'background-position': string,
	'background-size': string,
	color: string,
	'background-repeat': string,
	...
};

/**
 * Hacks around print and inlined styles.
 *
 * @author zuye.zheng
 */
export default class HtmlPrintifier {
	_rootEl: HTMLElement;
	_propertiesToPrintify: Array<string>;
	_touchedNodes: Array<NodeWithStyles>;
	_applied: boolean;
	_reverted: boolean;

	constructor(rootEl: HTMLElement) {
		this._rootEl = rootEl;
		this._propertiesToPrintify = [
			'background-color',
			'background-image',
			'background-position',
			'background-size',
			'color',
			'background-repeat'
		];
		this._touchedNodes = [];
		this._applied = false;
		this._reverted = false;
	}

	/**
	 * Apply the hacks, can only be applied once since we want to also be able to revert them so react doesn't freak
	 * out. Return the set of nodes altered.
	 */
	apply(): Array<NodeWithStyles> {
		if (this._applied) {
			throw new Error('Already applied.');
		}
		this._applied = true;
		this._apply(this._rootEl);

		return this._touchedNodes;
	}

	/* Revert all mucked with nodes. */
	revert(): void {
		if (this._reverted) {
			throw new Error('Already reverted.');
		}
		this._reverted = true;

		for (const curNode of this._touchedNodes) {
			if (curNode.stylesString != null) {
				curNode.node.setAttribute('style', curNode.stylesString);
			} else {
				// no style attribute at the start, remove any added
				curNode.node.removeAttribute('style');
			}
		}
	}

	/* Apply the hacks recursively to a HTML DOM node. */
	_apply(node: HTMLElement): void {
		let originalStylesString;
		if (node.hasAttribute('style')) {
			originalStylesString = node.getAttribute('style');
		}

		// figure out if we need to muck with styles for the current element
		const inlineStyles = this._parseStyles(originalStylesString);
		let touched = false;
		for (const curProperty of this._propertiesToPrintify) {
			if (inlineStyles[curProperty] != null) {
				// inline styles win
				if (inlineStyles[curProperty].indexOf('!important') < 0) {
					// add important if not already
					// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.192.0
					inlineStyles[curProperty] = `${inlineStyles[curProperty]} !important`;
					touched = true;
				}
			} else {
				const curCss = getComputedStyle(node).getPropertyValue(curProperty);

				if (curCss && curCss !== 'none') {
					// need to inline and importantize styles from CSS classes as well
					// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.192.0
					inlineStyles[curProperty] = `${curCss} !important`;
					touched = true;
				}
			}
		}

		if (touched) {
			// track it if we did
			node.setAttribute('style', this._serializeStyles(inlineStyles));
			this._touchedNodes.push({
				node,
				stylesString: originalStylesString
			});
		}

		// see if we need to check the children
		for (const curChild of node.childNodes) {
			// skip text and comment nodes
			if (curChild instanceof HTMLElement) {
				this._apply(curChild);
			}
		}
	}

	/* JQuery does not handle !important inline styles well so will need to parse manually. */
	_parseStyles(styleString: ?string): InlineStyle {
		if (styleString == null) {
			// $FlowFixMe[prop-missing] Added when making empty objects exact by default.
			return {};
		}

		const styles = {};
		for (let curStyle of styleString.split(';')) {
			curStyle = curStyle.trim();
			const curColonIndex = curStyle.indexOf(':');
			if (curColonIndex <= 0) {
				continue;
			}

			// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
			styles[curStyle.substring(0, curColonIndex).trim()] = curStyle.substring(curColonIndex + 1).trim();
		}

		// $FlowFixMe[prop-missing] Added when making empty objects exact by default.
		return styles;
	}

	/* JQuery also does not handle setting !important inline styles well so also need to serialize manually. */
	_serializeStyles(styles: InlineStyle): string {
		const stylesSerialized = [];
		for (const curStyle of Object.keys(styles)) {
			stylesSerialized.push(curStyle + ': ' + styles[curStyle] + ';');
		}
		return stylesSerialized.join(' ');
	}
}
