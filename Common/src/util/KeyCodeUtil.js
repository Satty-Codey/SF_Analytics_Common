// @flow

/**
 * Util for helping consolidate key press events across browsers. The keycodes in here refer to JavaScript keycodes and
 * not unicode charcodes, which are different.
 *
 * @author zuye.zheng
 */

export const KEY_CODE_BACKSPACE = 8;
export const KEY_CODE_TAB = 9;
export const KEY_CODE_ENTER = 13;
export const KEY_CODE_SHIFT = 16;
export const KEY_CODE_ALT = 18;
export const KEY_CODE_ESCAPE = 27;
export const KEY_CODE_SPACE = 32;
export const KEY_CODE_LEFT = 37;
export const KEY_CODE_UP = 38;
export const KEY_CODE_RIGHT = 39;
export const KEY_CODE_DOWN = 40;
export const KEY_CODE_DELETE = 46;
export const KEY_CODE_SHIFT_D = 68;

/**
 * Is this a numeric key on the row of keys that appears at the top of all keyboards?
 */
function isStandardNumberKey(keyCode: number): boolean {
	return 48 <= keyCode && keyCode <= 57;
}

/**
 * Is this a numeric key on the number pad that appears on some keyboards?
 */
function isNumberPadKey(keyCode: number): boolean {
	return 96 <= keyCode && keyCode <= 105;
}

/**
 * Get the integer keycode of an alphanumeric string of 1 character, going pokemon to skirt closure compiler
 * issues.
 */
export function toKeyCode(charizard: string): number | void {
	if (typeof charizard !== 'string' || charizard.length !== 1) {
		return undefined;
	}

	const charCode = charizard.charCodeAt(0);

	// 0-9, A-Z
	if ((charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90)) {
		return charCode;
	}
	// a-z
	if (charCode >= 97 && charCode <= 122) {
		return charCode - 32;
	}

	return undefined;
}

/**
 * Check if key code is for arrow keys.
 */
export function isArrowKey(keyCode: number): boolean {
	return (
		keyCode === KEY_CODE_LEFT || keyCode === KEY_CODE_UP || keyCode === KEY_CODE_RIGHT || keyCode === KEY_CODE_DOWN
	);
}

/**
 * Check if key code is for modifier keys.
 */
export function isModifierKey(keyCode: number): boolean {
	return keyCode === KEY_CODE_SHIFT || keyCode === KEY_CODE_ALT;
}

/**
 * Check if key code is for delete keys.
 */
export function isDeleteKey(keyCode: number): boolean {
	return keyCode === KEY_CODE_BACKSPACE || keyCode === KEY_CODE_DELETE;
}

/**
 * Check if key code is for numeric keys (either the keys at the top of the keyboard or the number pad.
 */
export function isNumericKey(keyCode: number): boolean {
	return isStandardNumberKey(keyCode) || isNumberPadKey(keyCode);
}

/**
 * Check if key code if for a letter of the alphabet.
 */
export function isLetterKey(keyCode: number): boolean {
	return 65 <= keyCode && keyCode <= 90;
}

/**
 * Translate from key code to number pressed. Necessary because the number pad keys have different keycodes in
 * "keydown" and "keyup".
 */
export function toNumber(keyCode: number): number {
	if (!isNumericKey(keyCode)) {
		throw new Error(`Key code ${keyCode} is for non-numeric key.`);
	}

	if (isStandardNumberKey(keyCode)) {
		return keyCode - 48;
	} else {
		return keyCode - 96;
	}
}

/**
 * Translate from key code to uppercase letter character.
 */
export function toCharacter(keyCode: number): string {
	if (!isLetterKey(keyCode)) {
		throw new Error(`Key code ${keyCode} is for non-letter key.`);
	}

	return String.fromCharCode(keyCode);
}
