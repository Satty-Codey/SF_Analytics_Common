//@flow
import typeof DropDirection from 'Common/src/interaction/DropDirection.coffee';

/**
 * Type for drag-n-drop payloads
 * @author iminevskiy, mary.wong
 */

// Drag payload or drop payload
export type DragPayload = {
	name: string,
	index: number,
	originalIndex: number,
	interactionZoneName: string,
	value: string,
	reportType: string,
	isCommon: boolean,
	detailIndices: Array<number>,
	blockIndex: number,
	blockId: string,
	itemSize: number,
	direction: DropDirection,
	isKeyboard: boolean,
	...
};

// Dragged item info to be used in DragMultiPayload
export type DragPayloadItem = {
	// Item index
	index: number,
	// unadjust item index
	originalIndex: number,
	// Drag zone where the item already belongs to, e.g. details or grouping
	interactionZoneName: string,
	// Column name
	value: string,
	// Can be used for grouping i.e. is a common field for multi-block cases; true for other report types
	isCommon: boolean,
	// Column indices; single for non-multi-block reports; can be multiple for multi-block
	detailIndices: Array<number>,
	blockIndex: number,
	blockId: string,
	// Used for placehold size calculation
	itemSize: number,
	...
};

// For multi-select drag-and-drop, the drag/drop payload will be asymetric whereby the drag payload has
// multiple dragged items, while the drop payload would not have multiple items
export type DragMultiPayload = {
	// The drag zone where the dragging begin
	name: string,
	// Report type for multi-block; empty for non-multi-block
	reportType: string,
	direction: DropDirection,
	isKeyboard: boolean,
	items: Array<DragPayloadItem>,
	...
};
