//@flow
import Delta from 'quill-delta';

// eslint-disable-next-line no-restricted-imports
import {type RichTextContentBlock} from 'WaveCommon/src/metadata/dashboard/DynamicDataJson.js';

/**
 * Utility to convert Delta into RichTextContent
 * @param delta
 */
export function convertToRichTextContent(
	// $FlowFixMe[value-as-type]
	delta: Delta
): Array<RichTextContentBlock> | void {
	if (delta == null || delta.ops == null || !Array.isArray(delta.ops)) {
		return;
	}

	return [...delta.ops];
}

/**
 * Utility to convert RichTextContent into Delta
 * @param richTextContent
 */
export function convertToDelta(
	richTextContent: ?Array<RichTextContentBlock>
	// $FlowFixMe[value-as-type]
): Delta {
	if (richTextContent == null || richTextContent.length === 0 || !Array.isArray(richTextContent)) {
		return new Delta();
	}

	const delta = richTextContent.reduce(
		// $FlowFixMe[value-as-type]
		(acc: Delta, content: RichTextContentBlock) => acc.insert(String(content.insert), {...content.attributes}),
		new Delta()
	);

	return delta;
}

export const fontSizes: Array<string> = [
	'10px',
	'12px',
	'13px',
	'14px',
	'16px',
	'18px',
	'20px',
	'24px',
	'28px',
	'32px',
	'42px',
	'48px',
	'52px',
	'64px',
	'72px',
	'96px',
	'128px'
];

export const MAX_RTE_FONT_SIZE = 500;
export const MIN_RTE_FONT_SIZE = 1;
export const DEFAULT_TEXT_SIZE = '16';

export const rendererFontSizes: Array<string> = [...Array(MAX_RTE_FONT_SIZE)].map((value, index) => `${index + 1}px`);
const endsInPx = new RegExp('px$', 'i');

export const giveTextSizeClean = (textSizeStr: string): string => {
	const trimTxt = textSizeStr.trim();
	if (trimTxt.match(endsInPx)) {
		return trimTxt.slice(0, -2);
	}
	return trimTxt;
};

export const isTextSizeValid = (value: string | number): boolean => {
	if (!value) {
		return false;
	}
	const valueStr = giveTextSizeClean(value.toString());
	if (isNaN(valueStr)) {
		return false;
	}
	const x = parseFloat(valueStr);
	if (!Number.isInteger(x)) {
		return false;
	}
	if (x >= MIN_RTE_FONT_SIZE && x <= MAX_RTE_FONT_SIZE) {
		return true;
	}
	return false;
};

export const isTextSizeTypable = (value: string): boolean =>
	(!isNaN(value) && Number.isInteger(Number(value))) || value === '';
export type Range = {
	index: number,
	length: number
};
export type TextSizeType = {
	fontSizeMenuOptions?: Array<string>,
	textSizeDropDownClass?: string,

	textSizeInputValue: string,
	finishUpdateTextSize: (val: string, udateFormat?: boolean) => void
};

export type SelectOrSubmitEvent = {
	target: {value: string | Array<{...}>, ...},
	preventDefault: () => void,
	stopPropagation: () => void
};

export type Counter = {
	container: string,
	limit: number
};
