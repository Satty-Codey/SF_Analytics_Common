// @flow
/**
 * Insert the given text into a text area element.
 *
 * This function wouldn't even be needed if all browsers supported document.execCommand('insertText') on text areas. But
 * we have to do it "manually" instead and we don't even get undo/redo for our trouble.
 *
 * TODO: Move to UIUtil when UIUtil.coffee converted to ES6.
 */
export default function insertText(textAreaEl: HTMLTextAreaElement, text: string, caretOffset: ?number = 0): void {
	// Delete any selected text in the text area, since the insert should replace any selected text
	const content = textAreaEl.value;
	const selectionStart = textAreaEl.selectionStart;
	const selectionEnd = textAreaEl.selectionEnd;
	const tempContent = content.substr(0, selectionStart) + content.substr(selectionEnd);

	// Insert the text into the content at the current caret position
	const updatedContent = tempContent.substr(0, selectionStart) + text + tempContent.substr(selectionStart);
	textAreaEl.value = updatedContent;

	// Set the caret to the end of the inserted text + any specified offset
	textAreaEl.focus();
	// $FlowFixMe[unsafe-addition]
	const newSelectionStart = selectionStart + text.length + caretOffset;
	textAreaEl.setSelectionRange(newSelectionStart, newSelectionStart);
}
