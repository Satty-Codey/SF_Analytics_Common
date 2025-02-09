module.exports = class DragAndDropInfo
	###
	Drag and Drop config object provided to DragAndDropRC
	###
	constructor: (
		@_isDraggable
		@_isDroppable
		@_name
		@_effectAllowed
		@_direction
		@_draggableClass
		@_draggingClass
		@_nonDraggableElementIndex
		@_onDropOutside
		@_onDrop
		@_preventDrop
		@_onDragOver
		@_onDragEnd
		@_renderPlaceHolder
		@_removeOnDragging
		@_onDragLeave
		@_renderItemOnDropFromOtherZone
		@_neighbors
		@_validateNeighbor
		@_itemSpacing
		@_hasAnimation
		@_allowDropOnItem
		@_skipUpdateOnNewProps
		@_placeholderSize
		@_getPlaceholderPosition
		@_getInteractionZoneName
		@_useGPUAnimation
		@_useCustomDragImage
		@_renderComponentDragImage
		@_isListBox
		@_isMultiSelectEnabled
		@_onKeyDown
	) ->

	setIsDraggable: (@_isDraggable) -> @

	setIsDroppable: (@_isDroppable) -> @

	setName: (@_name) -> @

	setEffectAllowed: (@_effectAllowed) -> @

	setDirection: (@_direction) -> @

	setDraggableClass: (@_draggableClass) -> @

	setDraggingClass: (@_draggingClass) -> @

	setNonDraggableElementIndex: (@_nonDraggableElementIndex) -> @

	setRenderPlaceHolder: (@_renderPlaceHolder) -> @

	setRemoveOnDragging: (@_removeOnDragging) -> @

	setOnDragStart: (@_onDragStart) -> @

	setOnDropOutside: (@_onDropOutside) -> @

	setOnDrop: (@_onDrop) -> @

	setOnDragOver: (@_onDragOver) -> @

	setOnDragEnd: (@_onDragEnd) -> @

	setPreventDrop: (@_preventDrop) -> @

	setOnDragLeave: (@_onDragLeave) -> @

	setExtraDragPayloadSetter: (@_setExtraDragPayload) -> @

	setChildDropIndexGetter: (@_getChildDropIndex) -> @

	setGlobalDragAndDropIndicesGetter: (@_getGlobalDragAndDropIndices) -> @

	setRenderItemOnDropFromOtherZone: (@_renderItemOnDropFromOtherZone) -> @

	setNeighbors: (@_neighbors) -> @

	setValidateNeighbor: (@_validateNeighbor) -> @

	setItemSpacing: (@_itemSpacing) -> @

	setHasAnimation: (@_hasAnimation) -> @

	setUseGPUAnimation: (@_useGPUAnimation) -> @

	setAllowDropOnItem: (@_allowDropOnItem) -> @

	setSkipUpdateOnNewProps: (@_skipUpdateOnNewProps) -> @

	setPlaceholderSize: (@_placeholderSize) -> @

	setPlaceholderPositionGetter: (@_getPlaceholderPosition) -> @

	setGetInteractionZoneName: (@_getInteractionZoneName) -> @

	setUseCustomDragImage: (@_useCustomDragImage) -> @

	setRenderComponentDragImage: (@_renderComponentDragImage) -> @

	setIsListBox: (@_isListBox) -> @

	setIsMultiSelectEnabled: (@_isMultiSelectEnabled) -> @

	setOnKeyDown: (@_onKeyDown) -> @

	getInfo: ->
		isDroppable: @_isDroppable
		isDraggable: @_isDraggable
		name: @_name
		effectAllowed: @_effectAllowed
		direction: @_direction
		draggableClass: @_draggableClass
		draggingClass: @_draggingClass
		onDropOutside: @_onDropOutside
		preventDrop: @_preventDrop
		nonDraggableElementIndex: @_nonDraggableElementIndex
		onDragStart: @_onDragStart
		onDrop: @_onDrop
		onDragOver: @_onDragOver
		onDragEnd: @_onDragEnd
		renderPlaceHolder: @_renderPlaceHolder
		removeOnDragging: @_removeOnDragging
		onDragLeave: @_onDragLeave
		setExtraDragPayload: @_setExtraDragPayload
		getChildDropIndex: @_getChildDropIndex
		getGlobalDragAndDropIndices: @_getGlobalDragAndDropIndices
		renderItemOnDropFromOtherZone: @_renderItemOnDropFromOtherZone
		neighbors: @_neighbors
		validateNeighbor: @_validateNeighbor
		itemSpacing: @_itemSpacing
		hasAnimation: @_hasAnimation
		useGPUAnimation: @_useGPUAnimation
		allowDropOnItem: @_allowDropOnItem
		skipUpdateOnNewProps: @_skipUpdateOnNewProps
		placeholderSize: @_placeholderSize
		getPlaceholderPosition: @_getPlaceholderPosition
		getInteractionZoneName: @_getInteractionZoneName
		useCustomDragImage: @_useCustomDragImage
		renderComponentDragImage: @_renderComponentDragImage
		isListBox: @_isListBox
		isMultiSelectEnabled: @_isMultiSelectEnabled
		onKeyDown: @_onKeyDown

