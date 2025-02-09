// @flow
import {assign} from 'lodash/object.js';

import type {Color} from 'Common/src/component/form/colorpicker/Color.js';

const SHORT_HEX_FORMAT_REGEX = /^#[0-9A-F]{3}$/i;
const HEX_FORMAT_REGEX = /^(#(?:[0-9A-F]{3}){1,2})$/i;
const HEXA_FORMAT_REGEX = /^(#(?:[0-9A-F]{2}){4})$/i;
const RGB_FORMAT_REGEX =
	/^rgb\(\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*\)$/i;
const RGBA_FORMAT_REGEX =
	/^rgba\(\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0?\.[0-9]+|[01])\s*\)\s*$/i;

/**
 * Utils for manipulating color codes.
 */

/**
 * Create RGB code from individual color components.
 */
function toRgbCode(r: string | number, g: string | number, b: string | number): string {
	return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get the saturation for a color given some information.
 */
function getSaturation(minRgb: number, maxRgb: number, luminance: number): number {
	if (minRgb === maxRgb) {
		return 0;
	} else if (luminance < 50) {
		return (maxRgb - minRgb) / (maxRgb + minRgb);
	} else {
		return (maxRgb - minRgb) / (2 - maxRgb - minRgb);
	}
}

/**
 * Get the hue for a color given some information.
 */
function getHue(minRgb: number, maxRgb: number, red: number, green: number, blue: number): number {
	if (maxRgb === minRgb) {
		return 0;
	} else if (maxRgb === red) {
		return (green - blue) / (maxRgb - minRgb);
	} else if (maxRgb === green) {
		return 2 + (blue - red) / (maxRgb - minRgb);
	} else {
		return 4 + (red - green) / (maxRgb - minRgb);
	}
}

/**
 * If the given string is in #FFF format.
 */
export function isShortHexFormat(string: string): boolean {
	return SHORT_HEX_FORMAT_REGEX.test(string);
}

/**
 * If the given string is in #FFF or #FFFFFF format.
 */
export function isHexFormat(string: string): boolean {
	return HEX_FORMAT_REGEX.test(string);
}

/**
 * If the given string is in #FFFFFFFF format.
 */
export function isHexAFormat(string: string): boolean {
	return HEXA_FORMAT_REGEX.test(string);
}

/**
 * If the given string is in rgb(255, 255, 255) format.
 */
export function isRgbFormat(string: string): boolean {
	return RGB_FORMAT_REGEX.test(string);
}

/**
 * If the given string is in rgba(255, 255, 255, 0.5) format.
 */
export function isRgbaFormat(string: string): boolean {
	return RGBA_FORMAT_REGEX.test(string);
}

/**
 * Convert hex color code to string in RGB format. Assumes hex code has pound sign and all six characters.
 */
export function hexToRgbElements(colorCode: string): Array<number> {
	const hexCode = isShortHexFormat(colorCode)
		? `#${colorCode
				.slice(1)
				.split('')
				.map((character) => character + character)
				.join('')}`
		: colorCode;

	if (!isHexFormat(hexCode)) {
		throw new Error(`Invalid color code: ${hexCode} is not in hex format`);
	}

	const elements = [];
	for (let i = 1; i < hexCode.length; i += 2) {
		elements.push(parseInt(hexCode.slice(i, i + 2), 16));
	}
	return elements;
}

/**
 * Convert HEX to RGB.
 */
export function hexToRgb(hexCode: string): string {
	const [r, g, b] = hexToRgbElements(hexCode);

	return toRgbCode(r, g, b);
}

/**
 * Convert RGB color code to string in hex format.
 */
export function rgbToHex(rgbCode: string): string {
	const rgbMatch = rgbCode.match(RGB_FORMAT_REGEX);

	if (!rgbMatch) {
		throw new Error(`Invalid color code: ${rgbCode} is not in RGB format`);
	}

	return `#${rgbMatch
		.slice(1)
		.map((number) => `0${parseInt(number, 10).toString(16)}`.slice(-2))
		.join('')
		.toUpperCase()}`;
}

/**
 * Convert RGBA color code to string in hex format.
 */
export function rgbaToHex(rgbaCode: string): string {
	const rgbaMatch = rgbaCode.match(RGBA_FORMAT_REGEX);

	if (!rgbaMatch) {
		throw new Error(`Invalid color code: ${rgbaCode} is not in RGB format`);
	}
	const [red, green, blue] = rgbaMatch.slice(1);
	return rgbToHex(toRgbCode(red, green, blue));
}

/**
 * Return alpha as percentage
 */
export function getOpacityFromRgba(rgbaCode: string): string {
	const rgbaMatch = rgbaCode.match(RGBA_FORMAT_REGEX);
	let a;
	if (rgbaMatch) {
		a = rgbaMatch[4];
	}
	return (+a * 100).toString();
}

/**
 * Convert RGB color code to array of hue, saturation, and luminance.
 * Uses method documented here: http://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/
 */
export function rgbToHsl(rgbCode: string): [number, number, number] {
	const rgbMatch = rgbCode.match(RGB_FORMAT_REGEX);

	if (!rgbMatch) {
		throw new Error(`Invalid color code: ${rgbCode} is not in RGB format`);
	}

	const normalizedRgb = rgbMatch.slice(1).map((number) => Number(number) / 255);

	const [red, green, blue] = normalizedRgb;

	const minRgb = Math.min(...normalizedRgb);
	const maxRgb = Math.max(...normalizedRgb);

	const luminance = (100 * (minRgb + maxRgb)) / 2;
	const saturation = 100 * getSaturation(minRgb, maxRgb, luminance);
	const hue = 60 * getHue(minRgb, maxRgb, red, green, blue);

	return [Math.round(hue), Math.round(saturation), Math.round(luminance)];
}

/**
 * Given a color code, return a similar but discernibly-different color in HSL or HSLA format.
 */
export function getComplementaryColor(colorCode: string): string {
	let rgbCode;
	let a;

	if (isHexFormat(colorCode)) {
		rgbCode = hexToRgb(colorCode);
	} else if (isHexAFormat(colorCode)) {
		rgbCode = hexToRgb(colorCode.slice(0, -2));
		a = +alphaHexToPercentage(colorCode.slice(7)) / 100;
	} else {
		const rgbaMatch = colorCode.match(RGBA_FORMAT_REGEX);

		if (rgbaMatch) {
			let r, g, b;
			[r, g, b, a] = rgbaMatch.slice(1);

			rgbCode = toRgbCode(r, g, b);
		} else {
			rgbCode = colorCode;
		}
	}

	let [h, s, l] = rgbToHsl(rgbCode);
	if (l < 20) {
		l += 8;
	} else if (l < 60) {
		l += 5;
	} else {
		l -= 5;
	}

	if (a != null) {
		return `hsla(${h}, ${s}%, ${l}%, ${a})`;
	} else {
		return `hsl(${h}, ${s}%, ${l}%)`;
	}
}

/**
 * Test if two color codes are equal, assuming that both are either RGB or hexadecimal for now.
 */
export function isEqual(colorCode: string, otherColorCode: string): boolean {
	const isColorRgb = isRgbFormat(colorCode);
	const isOtherRgb = isRgbFormat(otherColorCode);

	if (isColorRgb === isOtherRgb) {
		// both are RGB or both are hex
		return colorCode.toLowerCase() === otherColorCode.toLowerCase();
	} else if (!isColorRgb) {
		// first is hex, other is RGB
		return hexToRgb(colorCode).toLowerCase() === otherColorCode.toLowerCase();
	} else {
		// first is RGB, other is hex
		return colorCode.toLowerCase() === hexToRgb(otherColorCode).toLowerCase();
	}
}

/**
 * Extract brightness from a hex color code.
 */
export function getBrightnessFromHex(hexCode: string): number {
	const [r, g, b] = Array.from(hexToRgbElements(hexCode));

	// This is an estimate for luminance of the color based on its RGB elements
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Normalize hex code to include the pound sign.
 */
export function normalizeHexCode(hexCode: string): string {
	return hexCode[0] === '#' ? hexCode : `#${hexCode}`;
}

/**
 * Hex => RGBA
 */
export function hexToRgba(hexCode: string, opacity: number = 0): string {
	return `rgba(${hexToRgbElements(hexCode).concat([opacity]).join(', ')})`;
}

/**
 * Apply opacity to the given color code.
 */
export function applyOpacity(colorCode: string, opacity: number = 0): string {
	const rgbaMatch = colorCode.match(RGBA_FORMAT_REGEX);

	let hexCode;

	if (rgbaMatch) {
		const [red, green, blue] = rgbaMatch.slice(1);

		hexCode = rgbToHex(toRgbCode(red, green, blue));
	} else if (isRgbFormat(colorCode)) {
		hexCode = rgbToHex(colorCode);
	} else {
		hexCode = colorCode;
	}

	return hexToRgba(hexCode, opacity);
}

// Differs from the files HEX regex as it uses different capture groups and does not use short-form.
const HEX_REGEX = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i;

export type Options = {
	[key: string]: mixed,
	hex?: string,
	value?: number,
	hue?: number,
	alpha?: string,
	saturation?: number,
	red?: number,
	green?: number,
	blue?: number
};

/**
 * Check if two hexes are identical taking into account capitalization differences and alpha channel
 */
export function doHexMatch(hex1: string, hex2: string): boolean {
	// Parse alpha channel from string to ensure we match "#FFFFFFFF" with "#FFFFFF"
	// but not "#FFFFFF00" with "#FFFFFF"
	const [parsedHex1, parsedHex2] = [hex1, hex2].map((hex) =>
		hex.length === 9 && hex.slice(-2).toLowerCase() === 'ff' ? hex.slice(0, 7) : hex
	);
	return parsedHex1.toLowerCase() === parsedHex2.toLowerCase();
}

/**
 * Get new Color from Options type
 */
export function getNewColor(options: Options, customHexValidator?: (hex: string) => ?boolean, oldColor?: Color): Color {
	if (options.hex) {
		if (customHexValidator ? !customHexValidator(options.hex) : !isValidHex(options.hex)) {
			return assign({}, oldColor, {
				hex: options.hex,
				errors: assign({}, oldColor?.errors, {
					hex: true
				}),
				hsv: {
					hue: '',
					saturation: '',
					value: ''
				},
				rgb: {
					red: '',
					green: '',
					blue: ''
				}
			});
		}
		const oldAlpha = oldColor ? oldColor.alpha : '';
		return {
			hex: options.hex || '',
			hsv: getHsvFromHex(options.hex || ''),
			rgb: getRgbFromHex(options.hex || ''),
			alpha: options.alpha ? options.alpha : oldAlpha
		};
	}

	if ('red' in options || 'blue' in options || 'green' in options) {
		const rgb = assign({}, oldColor?.rgb, options);
		const errors = getRgbErrors(rgb);

		if (Object.values(errors).includes(true)) {
			return assign({}, oldColor, {
				rgb,
				errors: assign({}, oldColor?.errors, errors)
			});
		}
		const oldAlpha = oldColor ? oldColor.alpha : '';
		return {
			hex: getHexFromRgb(rgb),
			hsv: getHsvFromRgb(rgb),
			rgb,
			alpha: options.alpha !== undefined ? options.alpha : oldAlpha
		};
	}

	if (options.alpha !== undefined) {
		return assign({}, oldColor, {alpha: options.alpha});
	}

	if ('hue' in options || 'saturation' in options || 'value' in options) {
		const hsv = assign({}, oldColor?.hsv, options);
		return {
			hex: getHexFromHsv(hsv),
			hsv,
			rgb: getRgbFromHsv(hsv),
			alpha: oldColor ? oldColor.alpha : ''
		};
	}

	return {
		hex: '',
		hsv: {
			hue: 0,
			saturation: 0,
			value: 0
		},
		rgb: {
			red: 0,
			green: 0,
			blue: 0
		},
		alpha: ''
	};
}

type RGB = {red: number, green: number, blue: number};
type HSV = {hue: number, saturation: number, value: number};

/**
 * Takes in an alpha value (0-100)_base10 and returns it converted to hex (0-255)_base16
 */
export function alphaPercentageToHex(alphaPercentage: number): string {
	return Math.round((255 * alphaPercentage) / 100)
		.toString(16)
		.padStart(2, '0');
}

/**
 * Takes in an alpha hex (0-255)_base16 and returns it converted to percentage (0-100)_base10
 */
export function alphaHexToPercentage(alphaHex: string): string {
	return Math.round((100 / 255) * parseInt(alphaHex, 16)).toString();
}

/**
 * Get hex representation for a hsv input
 */
function getHexFromHsv({hue, saturation, value}: HSV): string {
	return getHexFromRgb(getRgbFromHsv({hue, saturation, value}));
}

/**
 * Get Hsv representation from hex
 */
function getHsvFromHex(hex: string): HSV {
	return getHsvFromRgb(getRgbFromHex(hex));
}

/**
 * Get hex for rgb representation
 */
function getHexFromRgb({red, green, blue}: RGB): string {
	/**
	 * Get hex for number
	 */
	function getHex(color: number) {
		return `0${Math.round(color).toString(16)}`.substr(-2);
	}
	return `#${getHex(red)}${getHex(green)}${getHex(blue)}`;
}

/**
 * Get hsv representation from rgb
 */
function getHsvFromRgb({red, green, blue}: RGB): HSV {
	const redRatio = red / 255;
	const greenRatio = green / 255;
	const blueRatio = blue / 255;

	const max = Math.max(redRatio, greenRatio, blueRatio);
	const min = Math.min(redRatio, greenRatio, blueRatio);

	const delta = max - min;
	const saturation = max === 0 ? 0 : (delta / max) * 100;
	const value = max * 100;
	let hue;

	if (max === min) {
		hue = 0;
	} else {
		if (redRatio === max) {
			hue = (greenRatio - blueRatio) / delta + (greenRatio < blueRatio ? 6 : 0);
		} else if (greenRatio === max) {
			hue = (blueRatio - redRatio) / delta + 2;
		} else {
			hue = (redRatio - greenRatio) / delta + 4;
		}

		hue *= 60;
	}

	return {hue, saturation, value};
}

/**
 * Get rgb representation from hsv
 */
function getRgbFromHsv({hue, saturation, value}: HSV): RGB {
	const hueRatio = hue / 360;
	const satRatio = saturation / 100;
	const valRatio = value / 100;

	let red;
	let green;
	let blue;

	const i = Math.floor(hueRatio * 6);
	const f = hueRatio * 6 - i;
	const p = valRatio * (1 - satRatio);
	const q = valRatio * (1 - f * satRatio);
	const t = valRatio * (1 - (1 - f) * satRatio);

	switch (i % 6) {
		case 0:
			red = valRatio;
			green = t;
			blue = p;
			break;
		case 1:
			red = q;
			green = valRatio;
			blue = p;
			break;
		case 2:
			red = p;
			green = valRatio;
			blue = t;
			break;
		case 3:
			red = p;
			green = q;
			blue = valRatio;
			break;
		case 4:
			red = t;
			green = p;
			blue = valRatio;
			break;
		default:
			red = valRatio;
			green = p;
			blue = q;
	}

	return {
		red: Math.round(red * 255),
		blue: Math.round(blue * 255),
		green: Math.round(green * 255)
	};
}

/**
 * Get rgb representation from hex
 */
function getRgbFromHex(hex: string): RGB {
	const result = HEX_REGEX.exec(toSixDigitHex(hex));
	if (!result) {
		return {red: -1, green: -1, blue: -1};
	}

	return {
		red: parseInt(result[1], 16),
		green: parseInt(result[2], 16),
		blue: parseInt(result[3], 16)
	};
}

/**
 * Get #FFFFFF from #FFF or #FFFFFFFF
 */
export function toSixDigitHex(value: string): string {
	let trimmedValue = value;
	if (value.length === 9) {
		trimmedValue = value.slice(0, 7);
	}

	const shortHandHex = /^#([a-f\d])([a-f\d])([a-f\d])$/i;
	const match = shortHandHex.exec(trimmedValue);
	if (match) {
		return `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`;
	}

	return trimmedValue;
}

/**
 * Check for RGB errors
 */
function getRgbErrors(rgb: RGB): {} {
	const hasError = (value: number) => isNaN(value) || Math.floor(value) !== Number(value) || value < 0 || value >= 256;

	return Object.entries(rgb).reduce((errors, keyValue) => {
		//$FlowFixMe[prop-missing] prop may have red, green, or blue error present
		errors[keyValue[0]] = hasError(+keyValue[1]);
		return errors;
	}, {});
}

/**
 * Check for hex errors
 */
function isValidHex(value: string): boolean {
	return !value || HEX_REGEX.test(toSixDigitHex(value));
}

/**
 * Change attributes from color using HSV
 */
export function getDeltaColor(
	options: Options,
	customHexValidator?: (hex: string) => ?boolean,
	oldColor: Color
): Color {
	const limitValue = (value: mixed) => Math.min(Math.max(+value, 0), 100);

	return getNewColor(
		{
			saturation: limitValue(oldColor.hsv.saturation + (options.saturation || 0)),
			value: limitValue(oldColor.hsv.value + (options.value || 0))
		},
		customHexValidator,
		oldColor
	);
}
