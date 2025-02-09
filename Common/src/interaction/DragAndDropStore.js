//@flow
import DropDirection from 'Common/src/interaction/DropDirection.coffee';
import type {DragPayload, DragMultiPayload, DragPayloadItem} from 'Common/src/interaction/DragPayload.js';

/**
 * Singleton store to put all the drag and drop payload during one drag/drop event
 * The purpose of this is to replace event.dataTransfer.getData limitation
 * Currently only on onDrop could read upon the information, but usually we need more in order
 * for drag and drop manager to behave like we expected
 *
 * @author jinming.you
 * @since 210
 */
class DragAndDropStore {
	_dragPayload: ?DragPayload | ?DragMultiPayload;
	_dragOverPayload: ?DragPayload;
	_dropped: boolean;
	_dropDirection: typeof DropDirection;
	_activeZone: string;
	_zoneNavigation: {...};

	setDragPayload(dragPayload: DragPayload | DragMultiPayload): this {
		this._dragPayload = dragPayload;
		return this;
	}

	getDragPayload(): ?DragPayload | ?DragMultiPayload {
		return this._dragPayload;
	}

	setDragOverPayload(dragOverPayload: DragPayload): this {
		this._dragOverPayload = dragOverPayload;
		return this;
	}

	getDragOverPayload(): ?DragPayload {
		return this._dragOverPayload;
	}

	setDropped(): this {
		this._dropped = true;
		return this;
	}

	isDropped(): boolean {
		return this._dropped;
	}

	setDropDirection(dropDirection: typeof DropDirection): this {
		this._dropDirection = dropDirection;
		return this;
	}

	setActiveZone(activeZone: string): this {
		this._activeZone = activeZone;
		return this;
	}

	getActiveZone(): string {
		return this._activeZone;
	}

	getDropDirection(): typeof DropDirection {
		return this._dropDirection;
	}

	registerZoneNavigation(name: string, callback: () => {...}) {
		if (!this._zoneNavigation) {
			this._zoneNavigation = {};
		}
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		this._zoneNavigation[name] = callback;
	}

	navigateToOtherZone(name: string, isAddingToHead: boolean, fromZone: string) {
		const zoneNavigation = this._zoneNavigation[name];
		if (zoneNavigation) {
			zoneNavigation.onMoveFromOtherZone(isAddingToHead, fromZone);
		}
	}

	notifyOtherZoneToCancelMove(name: string) {
		const zoneNavigation = this._zoneNavigation[name];
		if (zoneNavigation) {
			zoneNavigation.onCancelInOtherZone();
		}
	}

	notifyOtherZoneToMove(name: string) {
		const zoneNavigation = this._zoneNavigation[name];
		if (zoneNavigation) {
			zoneNavigation.onMoveConfirmInOtherZone();
		}
	}

	removeZoneNavigation(name: string) {
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.192.0
		this._zoneNavigation[name] = null;
	}

	reset() {
		this._dragPayload = null;
		this._dragOverPayload = null;
		this._dropped = false;
		this._dropDirection = null;
	}

	makePayload(props: {...}): DragPayload {
		return Object.assign(
			{
				name: '',
				index: -1,
				originalIndex: -1,
				interactionZoneName: '',
				value: '',
				reportType: '',
				isCommon: false,
				// $FlowFixMe[incompatible-return] Added when enabling local type inference.
				detailIndices: [],
				blockIndex: NaN,
				blockId: '',
				itemSize: 0,
				direction: DropDirection.BEFORE,
				isKeyboard: false
			},
			props
		);
	}

	makeMultiPayload(props: {...}): DragMultiPayload {
		return Object.assign(
			{
				name: '',
				reportType: '',
				direction: DropDirection.BEFORE,
				isKeyboard: false,
				// $FlowFixMe[incompatible-return] Added when enabling local type inference.
				items: []
			},
			props
		);
	}

	makePayloadItem(props: {...}): DragPayloadItem {
		return Object.assign(
			{
				index: -1,
				originalIndex: -1,
				interactionZoneName: '',
				value: '',
				isCommon: false,
				// $FlowFixMe[incompatible-return] Added when enabling local type inference.
				detailIndices: [],
				blockIndex: NaN,
				blockId: '',
				itemSize: 0
			},
			props
		);
	}

	convertPayloadItemToPayload(multiPayload: DragMultiPayload, item: DragPayloadItem): DragPayload {
		return {
			name: multiPayload.name,
			index: item.index,
			originalIndex: item.originalIndex,
			interactionZoneName: item.interactionZoneName,
			value: item.value,
			reportType: multiPayload.reportType,
			isCommon: item.isCommon,
			detailIndices: item.detailIndices,
			blockIndex: item.blockIndex,
			blockId: item.blockId,
			itemSize: item.itemSize,
			direction: multiPayload.direction,
			isKeyboard: multiPayload.isKeyboard
		};
	}

	// Get a DragPayload for single dragged item; return undefined if multiple items are being dragged

	// $FlowFixMe[unclear-type]
	getSinglePayloadFromZone(fromZone: any): DragPayload | void {
		// fromZone is not a DragMultiPayload (presumably DragPayload)
		if (!fromZone.items) {
			return fromZone;
		} else {
			const multiPayload: DragMultiPayload = fromZone;
			// fromZone is a DragMultiPayload with one item in the drag list; use the first one
			if (multiPayload.items && multiPayload.items.length === 1) {
				return this.convertPayloadItemToPayload(multiPayload, multiPayload.items[0]);
			}
		}

		// not able to convert
		return undefined;
	}

	// Get DragMultiPayload; it can take either DragMultiPayload or DragPayload

	// $FlowFixMe[unclear-type]
	getMultiPayloadFromZone(fromZone: any): DragMultiPayload {
		// If fromZone is already a DragMultiPayload, just return it
		if (fromZone.items) {
			return fromZone;
		} else {
			const singlePayload: DragPayload = fromZone;
			const payloadItem = this.makePayloadItem({
				index: singlePayload.index,
				originalIndex: singlePayload.originalIndex,
				interactionZoneName: singlePayload.interactionZoneName,
				value: singlePayload.value,
				isCommon: singlePayload.isCommon,
				detailIndices: singlePayload.detailIndices,
				blockIndex: singlePayload.blockIndex,
				blockId: singlePayload.blockId,
				itemSize: singlePayload.itemSize
			});
			return this.makeMultiPayload({
				name: singlePayload.name,
				reportType: singlePayload.reportType,
				direction: singlePayload.direction,
				isKeyboard: singlePayload.isKeyboard,
				items: [payloadItem]
			});
		}
	}
}

export default (new DragAndDropStore(): DragAndDropStore);
