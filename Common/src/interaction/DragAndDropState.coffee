Enum = require("Common/src/lang/Enum.coffee")
# needs a minimum height for drop area to catch drop event
MIN_DROP_AREA_HEIGHT = 4

adjustItemsSize = (itemsSize, removeIndex, insertIndex, insertSize) ->
	### Adjust items size array considering removing or inserting element ###
	if removeIndex? || insertIndex?
		itemsSize = itemsSize.slice()
		itemsSize.splice(removeIndex, 1) if removeIndex?
		if insertIndex?
			if removeIndex? && insertIndex > removeIndex
				insertIndex--
			itemsSize.splice(insertIndex, 0, insertSize)

	itemsSize

getTotalSize = (itemsSize, maxIndex, itemSpacing = 0) ->
	### Calculate total size of itemsSize array, sum until maxIndex element ###
	maxIndex ?= itemsSize.length
	total = 0
	total+= size for size, i in itemsSize when i < maxIndex

	total + itemSpacing * maxIndex


module.exports = class DragAndDropState extends Enum
	###
	Enum representing drag and drop state for current section
	@author alice.chen
	###

	getItemPosition: (i, itemsSize, itemSpacing, placeHolderHeight, dragIndex, dropIndex, isOnItem) ->
		### Return the section item's position relative to top of section ###
		@_value.getItemPosition(i, itemsSize, itemSpacing, placeHolderHeight, dragIndex, dropIndex, isOnItem)

	getSize: (itemsSize, itemSpacing, placeHolderHeight, dragIndex, isOnItem) ->
		### Return the total height of a section ###
		@_value.getSize(itemsSize, itemSpacing, placeHolderHeight, dragIndex, isOnItem)

	getPlaceholderPosition: (itemsSize, itemSpacing, dragIndex, dropIndex) ->
		### Return the position of placeholder ###
		@_value.getPlaceholderPosition(itemsSize, itemSpacing, dragIndex, dropIndex)

	DragAndDropState.build(DragAndDropState,
		NONE:
			getItemPosition: (i, itemsSize, itemSpacing, placeHolderHeight, dragIndex, dropIndex, isOnItem) ->
				getTotalSize(itemsSize, i, itemSpacing)

			getSize: (itemsSize, itemSpacing, placeHolderHeight, dragIndex, isOnItem) ->
				Math.max(getTotalSize(itemsSize, null, itemSpacing) - itemSpacing, MIN_DROP_AREA_HEIGHT)

			getPlaceholderPosition: (itemsSize, itemSpacing, dragIndex, dropIndex) ->
				0

		WITHIN_ZONE:
			getItemPosition: (i, itemsSize, itemSpacing, placeHolderHeight, dragIndex, dropIndex, isOnItem) ->
				itemsSize = adjustItemsSize(itemsSize, dragIndex, dropIndex, placeHolderHeight)

				adjustedIndex = i
				adjustedIndex-- if i > dragIndex
				adjustedIndex++ if i >= dropIndex

				getTotalSize(itemsSize, adjustedIndex, itemSpacing)

			getSize: (itemsSize, itemSpacing, placeHolderHeight, dragIndex, isOnItem) ->
				Math.max(getTotalSize(itemsSize, null, itemSpacing) - itemSpacing, MIN_DROP_AREA_HEIGHT)

			getPlaceholderPosition: (itemsSize, itemSpacing, dragIndex, dropIndex) ->
				@getItemPosition(dropIndex, itemsSize, itemSpacing, 0, dragIndex, dropIndex) - itemSpacing

		TO_OTHER_ZONE:
			getItemPosition: (i, itemsSize, itemSpacing, placeHolderHeight, dragIndex, dropIndex, isOnItem) ->
				itemsSize = adjustItemsSize(itemsSize, dragIndex)

				adjustedIndex = if i > dragIndex then i - 1 else i

				getTotalSize(itemsSize, adjustedIndex, itemSpacing)

			getSize: (itemsSize, itemSpacing, placeHolderHeight, dragIndex, isOnItem) ->
				itemsSize = adjustItemsSize(itemsSize, dragIndex)

				Math.max(getTotalSize(itemsSize, null, itemSpacing) - itemSpacing, MIN_DROP_AREA_HEIGHT)

			getPlaceholderPosition: (itemsSize, itemSpacing, dragIndex, dropIndex) ->
				0

		FROM_OTHER_ZONE:
			getItemPosition: (i, itemsSize, itemSpacing, placeHolderHeight, dragIndex, dropIndex, isOnItem) ->
				if !isOnItem
					itemsSize = adjustItemsSize(itemsSize, null, dropIndex, placeHolderHeight)

				adjustedIndex = if i >= dropIndex && !isOnItem then i + 1 else i

				getTotalSize(itemsSize, adjustedIndex, itemSpacing)

			getSize: (itemsSize, itemSpacing, placeHolderHeight, dragIndex, isOnItem) ->
				numItems = itemsSize.length
				return placeHolderHeight + itemSpacing if !numItems

				totalHeight = getTotalSize(itemsSize)
				# consider the incoming item as an additional one
				if isOnItem
					totalHeight + (numItems - 1) * itemSpacing
				else
					totalHeight + numItems * itemSpacing + placeHolderHeight

			getPlaceholderPosition: (itemsSize, itemSpacing, dragIndex, dropIndex) ->
				@getItemPosition(dropIndex, itemsSize, itemSpacing, 0, dragIndex, dropIndex) - itemSpacing
	)
