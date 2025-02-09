UNSAFE_DirectionSettings = require("@salesforce/design-system-react/module/components/utilities/UNSAFE_direction").default
createReactClass = require("create-react-class")
PropTypes = require("prop-types")
ReactDOM = require("react-dom")
React = require("react")
_ = require("lodash")
$ = require("jquery")

UIUtil = require("Common/src/util/UIUtil.coffee")
DragAndDropStore = require("Common/src/interaction/DragAndDropStore.js").default
KeyCodeUtil = require("Common/src/util/KeyCodeUtil.js")
EventUtil = require("Common/src/util/EventUtil.coffee")
DragAndDropState = require("Common/src/interaction/DragAndDropState.coffee")
DropDirection = require("Common/src/interaction/DropDirection.coffee")
LanguageDirectionUtil = require("Common/src/util/LanguageDirectionUtil").default
VERTICAL = "vertical"
HOTIZONTAL = "horizontal"
# a special key assin to placeholder element to make sure React always renders it with the same DOM
# so that we can have transition animation effect for the movement
PLACEHOLDER_KEY = "$$placeholder$$"


module.exports = DragAndDropRC = createReactClass
	###
	Drag and drop manager for react component
	Consumer who want to enable drag and drop on their component
	would need to wrap their component using DragAndDropRC
	<DragAndDropRC>
		<YourComponent>
	</DragAndDropRC>
	@author jinming.you
	@since 210
	###

	propTypes:
		# The name of the current drag/drop zone, this is used to differenticate various zone,
		# each zone should have unique name
		name: PropTypes.string.isRequired

		# Whether the current zone is draggable
		isDraggable: PropTypes.bool

		# Whether the current zone is droppable
		isDroppable: PropTypes.bool

		# Whether the dragged element got removed from dom once drag starts
		removeOnDragging: PropTypes.bool

		# Dragging effect
		effectAllowed: PropTypes.string

		# Custom handler when element is dropped to non-droppable zone
		onDropOutside: PropTypes.func

		# Custom handler when element is dropped to a valid droppable zone
		onDrop: PropTypes.func

		# Custom handler when element is being dragged over by draggable element
		onDragOver: PropTypes.func

		# Custom handler when draggable element is being dragged
		onDragStart: PropTypes.func

		# Custom handler when draggable element dragging end
		onDragEnd: PropTypes.func

		# Custom handler when drag leave
		onDragLeave: PropTypes.func

		# Custom handler to programtically prevent certain zone to be droppable
		preventDrop: PropTypes.func

		# Optional handler to add extra metadata to the payload to avoid re-calculations on every mouse move
		setExtraDragPayload: PropTypes.func

		# Optional handler to customize drop index of a child element. Takes the child index and a list of children.
		getChildDropIndex: PropTypes.func

		# Optional handler to get drag and drop indices in the global coordinates where they can be compared.
		getGlobalDragAndDropIndices: PropTypes.func

		# Drag direction, either "horizontal" or "vertical"
		direction: PropTypes.oneOf([HOTIZONTAL, VERTICAL])

		# Custom renderer to render placeholder for dropping index
		renderPlaceHolder: PropTypes.func

		# Custom renderer to render item after moved from other zone
		renderItemOnDropFromOtherZone: PropTypes.func

		# The class name added to the current dragged element
		draggingClass: PropTypes.string

		# The class name added to all draggable element
		draggableClass: PropTypes.string

		# The class name added to draggable element once removeOnDragging is true
		draghiddenClass: PropTypes.string

		# Custom logic to choose which particular child element does not need draggable
		nonDraggableElementIndex: PropTypes.array

		# The neighboar of component for keyboard accessbility navigation between zones(top, right, bottom, left)
		neighbors: PropTypes.array

		# Optional handler to validate a neighbor for the current drag payload
		validateNeighbor: PropTypes.func

		# Whether the dom element should be automatically deleted on remove or handled by contents
		shouldMoveFocusUponKeyDownDelete: PropTypes.bool

		# Whether the component will auto focus based on focus index after component update
		shouldAutoFocus: PropTypes.bool

		# Spacing between items
		itemSpacing: PropTypes.number

		# Animate items movement during drag and drop
		hasAnimation: PropTypes.bool

		# Whether to opt for better animation using transform by utilizing GPU
		useGPUAnimation: PropTypes.bool

		# Whether can drop on an item to complete actions like swap or replace. If ture, dragOverClass will be
		# applied for item targeted to be dropped at, also onDrop callback second parameter dropPayload will
		# have dropPayload.direction = DropDirection.ON
		allowDropOnItem: PropTypes.bool

		# Skip the update on new props receive
		skipUpdateOnNewProps: PropTypes.bool

		# The size of place holder used when calculate height during animation
		placeholderSize: PropTypes.number

		# Function that will return the index at which you would like to see the placeholder
		getPlaceholderPosition: PropTypes.func

		# Function that will return the interactionZone name based on current index
		getInteractionZoneName: PropTypes.func

		# Enables keyboard navigation
		enableKeyboardNavigation: PropTypes.bool

		# The class name added to draggable element when using keyboard accessbility mode to drag
		keyboardDraggingClass: PropTypes.string

		# Option to use custom mirror drag image
		useCustomDragImage: PropTypes.bool

		# Uses a custom component for the drag image
		renderComponentDragImage: PropTypes.func

		# The class to indicate that the zone is not allowed for dropping
		noDroppingClass: PropTypes.string

		isListBox: PropTypes.bool

		# Whether the component allows multi-select
		isMultiSelectEnabled: PropTypes.bool

		# To provide custom onKeydown behaviour for the component
		onKeyDown: PropTypes.func

	getDefaultProps: ->
		isDraggable: false
		isDroppable: false
		removeOnDragging: false
		effectAllowed: "move"
		direction: VERTICAL
		draggingClass: "dragging"
		dragOverClass: "dragOver"
		draggableClass: "draggable"
		draghiddenClass: "dragging-hidden"
		keyboardDraggingClass: "pick-list-item-dragging"
		noDroppingClass: "no-dropping"
		nonDraggableElementIndex: []
		neighbors: []
		validateNeighbor: -> true
		shouldMoveFocusUponKeyDownDelete: true
		shouldAutoFocus: true
		itemSpacing: 0
		hasAnimation: false
		skipUpdateOnNewProps: false
		allowDropOnItem: false
		placeholderSize: 0
		getInteractionZoneName: -> @name
		setExtraDragPayload: ->
		getChildDropIndex: (index, children, isDroppingAfter, isPlaceholder) -> index
		getGlobalDragAndDropIndices: null
		enableKeyboardNavigation: true
		useGPUAnimation: false
		useCustomDragImage: false
		isListBox: true
		isMultiSelectEnabled: false

	defaultGetGlobalDragAndDropIndices: (dragPayload, index) ->
		singleDraggedItem = DragAndDropStore.getSinglePayloadFromZone(dragPayload)
		multiDraggedItems = DragAndDropStore.getMultiPayloadFromZone(dragPayload)
		return {
			# Use payload index if it is a single dragged item; return -1
			dragIndex: singleDraggedItem?.index ? -1
			# For multi-selected items, we return an array
			multiDragIndices: item.index for item in multiDraggedItems.items
			dropIndex: index
		}

	getInitialState: ->
		draggingIndex: -1
		draggingOverIndex: -1
		placeholderIndex: -1
		children: @_getChildrenWithAddOnProps(React.Children.only(@props.children).props.children)
		keyDownActiveIndex: -1
		focusIndex: -1
		dragAndDropState: DragAndDropState.NONE

	componentDidUpdate: (prevProps, prevState)->
		if @props.enableKeyboardNavigation
			prevElementIndex = if prevState.focusIndex == -1 then 0 else prevState.focusIndex
			@_elements[prevElementIndex]?.tabIndex = -1
			elementIndex = if @state.focusIndex == -1 then 0 else @state.focusIndex
			@_elements[elementIndex]?.tabIndex = 0

		if @props.shouldAutoFocus
			@_elements[prevState.focusIndex]?.blur?() if prevState.focusIndex != -1 && prevState.focusIndex != @state.focusIndex
			@_elements[@state.focusIndex]?.focus?() if @state.focusIndex != -1

		if prevState.keyDownActiveIndex != @state.keyDownActiveIndex
			ReactDOM.findDOMNode(@_elements[prevState.keyDownActiveIndex])?.classList.remove(@props.keyboardDraggingClass) if prevState.keyDownActiveIndex != -1
			ReactDOM.findDOMNode(@_elements[@state.keyDownActiveIndex])?.classList.add(@props.keyboardDraggingClass) if @state.keyDownActiveIndex != -1
		@_startAnimation()

	componentDidMount: ->
		@_initialize()
		@_startAnimation()

	componentWillUnmount: ->
		@_tearDown()

	UNSAFE_componentWillMount: ->
		@_elements = []

	UNSAFE_componentWillReceiveProps: (nextProps) ->
		@_prevChildren = null
		return if nextProps.skipUpdateOnNewProps
		@setState(
			children: @_getChildrenWithAddOnProps(React.Children.only(nextProps.children).props.children)
		)

	render: ->
		topLevel = React.Children.only(@props.children)
		children = @state.children.slice()
		if @_showPlaceholder()
			children.splice(@state.placeholderIndex, 0, @_getPlaceHolder())
		props = {children, onDragEnter: @_onDragEnter, onDragLeave: @_onDragLeave}
		props.onDrop = @_onDrop if @props.isDroppable
		props.onDragOver = @_onDragOver if @props.isDroppable

		React.cloneElement(topLevel, props)

	_initialize: ->
		DragAndDropStore.registerZoneNavigation(@props.name, {
			onMoveFromOtherZone: @_onMoveFromOtherZone
			onCancelInOtherZone: @_onCancelInOtherZone
			onMoveConfirmInOtherZone: @_onMoveConfirmInOtherZone
		})

	_tearDown: ->
		DragAndDropStore.removeZoneNavigation(@props.name)

	_getChildrenWithAddOnProps: (children) ->
		for child, index in React.Children.toArray(children)
			React.cloneElement(child, @_getAddOnProps(index, child.props))

	_getAddOnProps: (index, existingProps) ->
		props = {}
		props.onDragStart = @_onDragStart.bind(@, index) if @_isDraggable(index)
		props.onDragEnd = @_onDragEnd.bind(@, index) if @_isDraggable(index)
		props.onKeyDown = @_onKeyDown.bind(@, index) if @props.enableKeyboardNavigation
		props.onClick = @_onClick.bind(@, index)
		props.onBlur = @_onBlur.bind(@, index)
		props.draggable = @_isDraggable(index)
		props.ref = @_getRef.bind(@, index)
		props.className = @_getClass(index, existingProps.className)
		props.tabIndex = @_getTabIndex(index, existingProps.tabIndex) if @props.enableKeyboardNavigation
		props

	_getTabIndex: (index, currentTabIndex) ->
		focusIndex = if @state? then @state.focusIndex else -1
		if @props.enableKeyboardNavigation
			if index == focusIndex || (index == 0 && focusIndex == -1) then 0 else undefined
		else
			currentTabIndex

	_isDraggable: (index) ->
		_.indexOf(@props.nonDraggableElementIndex, index) is -1 and @props.isDraggable

	_getRef: (index, element) ->
		@_elements ?= []
		@_elements[index] = element

	_getClass: (index, existingClassName) ->
		keyDownActiveIndex = if @state? then @state.keyDownActiveIndex else -1
		existingClassName = existingClassName?.replace(new RegExp("#{@props.draggableClass}|#{@props.keyboardDraggingClass}", "gi"), "")
		UIUtil.buildClassName(
			existingClassName
			@props.draggableClass if @_isDraggable(index)
			@props.keyboardDraggingClass if keyDownActiveIndex == index
		)

	_getPlaceHolder: ->
		placeHolder = @props.renderPlaceHolder(@state.draggingOverIndex)
		React.cloneElement(placeHolder, {
			key: PLACEHOLDER_KEY
			ref: (@_placeholderDOM) =>
		})

	_removePlaceHolder: ->
		@setState({placeholderIndex: -1})

	_showPlaceholder: ->
		###
		If the current dragged element's position is the same as placeholder position, we don't show it
		###
		dragPayload = DragAndDropStore.getDragPayload()
		@state.draggingOverIndex != -1 &&
		@state.placeholderIndex != -1 &&
		@props.renderPlaceHolder? &&
		!(@_isFromSameZone() && (dragPayload.index == @state.placeholderIndex || dragPayload.index + 1 == @state.placeholderIndex))

	_onMoveFromOtherZone: (isAddingToHead, fromZone) ->
		dropIndex = if isAddingToHead then 0 else @state.children.length
		@_neighbors ?= []
		@_neighbors[@_getDirectionIndex(!isAddingToHead)] = fromZone
		@_renderItemOnDropFromOtherZone(@_getDropPayload(dropIndex))

	_onCancelInOtherZone: ->
		@_resetToPreviousState()

	_onMoveConfirmInOtherZone: ->
		@_prevChildren = @state.children.slice()

	_onClick: (index, e) ->
		@setState({focusIndex: index})

	_onBlur: (index, e) ->
		if @props.enableKeyboardNavigation
			if @state.keyDownActiveIndex == -1
				if @state.focusIndex != -1
					@setState({focusIndex: -1})
			else
				@_resetToPreviousState()
				if !@_isFromSameZone()
					DragAndDropStore.notifyOtherZoneToCancelMove(DragAndDropStore.getDragPayload().name)
		else
			@setState({focusIndex: -1})

	_onKeyDown: (index, e, selectionCallback) ->
		if @props.isMultiSelectEnabled?
			multipleValuesSelected = @props.onKeyDown?(index , e, @_updateChildren, selectionCallback, @state.children)
			if multipleValuesSelected
				return
		if @_isVertical()
			keyUpCode = KeyCodeUtil.KEY_CODE_UP
			keyDownCode = KeyCodeUtil.KEY_CODE_DOWN
		else if @_isRtl()
			keyUpCode = KeyCodeUtil.KEY_CODE_RIGHT
			keyDownCode = KeyCodeUtil.KEY_CODE_LEFT
		else
			keyUpCode = KeyCodeUtil.KEY_CODE_LEFT
			keyDownCode = KeyCodeUtil.KEY_CODE_RIGHT

		switch e.keyCode
			when KeyCodeUtil.KEY_CODE_SPACE
				EventUtil.trap(e)
				return if !@_isDraggable(index)
				if @state.keyDownActiveIndex == index
					dragPayload = DragAndDropStore.getDragPayload()
					@props.onDrop?(dragPayload, @_getDropPayload(@props.getChildDropIndex(index, @state.children), null, null, true))
					@props.onDragLeave?()
					@_prevChildren = @state.children.slice()
					@_neighbors = []
					@_resetRenderState()
					if !@_isFromSameZone()
						DragAndDropStore.notifyOtherZoneToMove(dragPayload.name)
				else
					dragPayload = @_getDragPayload(index, e.currentTarget)
					DragAndDropStore.setDragPayload(dragPayload)
					@setState(
						focusIndex: index
						keyDownActiveIndex: index
					)

			when keyDownCode
				EventUtil.trap(e)
				if @state.keyDownActiveIndex != -1
					return if !@_isDraggable(index)
					if index + 1 < @state.children.length && !@_isEmptyZone()
						@_moveItemIfFromSameZone(index, index + 1)
					else
						bottomNeighbor = @_getNeighbors(@_getDirectionIndex(true))
						return if !@_isValidNeighbor(bottomNeighbor)
						@_removeItem(index)
						DragAndDropStore.navigateToOtherZone(bottomNeighbor, true, @props.name)
				else if @props.isListBox
					@_moveFocusToNext(index, true)

			when keyUpCode
				EventUtil.trap(e)
				if @state.keyDownActiveIndex != -1
					return if !@_isDraggable(index)
					if index - 1 >= 0 && !@_isEmptyZone()
						@_moveItemIfFromSameZone(index, index - 1)
					else
						topNeighbor = @_getNeighbors(@_getDirectionIndex(false))
						return if !@_isValidNeighbor(topNeighbor)
						@_removeItem(index)
						DragAndDropStore.navigateToOtherZone(topNeighbor, false, @props.name)
				else if @props.isListBox
					@_moveFocusToNext(index, false)

			when KeyCodeUtil.KEY_CODE_ESCAPE
				return if @state.keyDownActiveIndex == -1
				EventUtil.trap(e)
				@_resetToPreviousState()
				if !@_isFromSameZone()
					DragAndDropStore.notifyOtherZoneToCancelMove(DragAndDropStore.getDragPayload().name)

			when KeyCodeUtil.KEY_CODE_TAB
				moveBackward = e.shiftKey && index != 0
				moveForward = !e.shiftKey && (index + 1 != @state.children.length)
				moveFocusInside = moveBackward || moveForward
				return if !moveFocusInside
				EventUtil.trap(e)
				@_moveFocusToNext(index, moveForward)

			when KeyCodeUtil.KEY_CODE_BACKSPACE, KeyCodeUtil.KEY_CODE_DELETE
				EventUtil.trapImmediate(e)
				@_elements[index]?.onRemove?(e)
				@_moveFocusUponKeyDownDelete(index)

			when KeyCodeUtil.KEY_CODE_ENTER
				EventUtil.trap(e)
				@_elements[index]?.onClickOrKeyboardEnter?(e)

	_isValidNeighbor: (neighbor)  ->
		neighbor && @props.validateNeighbor(@state.children.length, neighbor, DragAndDropStore.getDragPayload())

	_isVertical: ->
		@props.direction == VERTICAL

	_getDirectionIndex: (isBottom) ->
		if isBottom
			if @_isVertical() then 2 else 1
		else
			if @_isVertical() then 0 else 3

	_getNeighbors: (direction) ->
		@_neighbors?[direction] || @props.neighbors[direction]

	_resetToPreviousState: ->
		@_neighbors = []
		@setState(
			keyDownActiveIndex: -1
			children: @_prevChildren || @_getChildrenWithAddOnProps(React.Children.only(@props.children).props.children)
		)

	_moveFocusUponKeyDownDelete: (index) ->
		return if !@props.shouldMoveFocusUponKeyDownDelete
		children = @state.children.slice()
		children.splice(index, 1)
		focusIndex =
			if children.length is 0
				-1
			else
				if children.length is index
					index - 1
				else
					index
		@setState({focusIndex, children: @_getChildrenWithAddOnProps(children)})

	_moveFocusToNext: (index, isNext) ->
		focusIndex =
			if isNext
				if index + 1 == @state.children.length then 0 else index + 1
			else
				if index == 0 then @state.children.length - 1 else index - 1
		@setState({focusIndex})

	_getDragAndDropState: ->
		activeZone = DragAndDropStore.getActiveZone()
		dragZone = DragAndDropStore.getDragPayload()?.name
		if !dragZone?
			DragAndDropState.NONE
			# no drag action
		else if dragZone == @props.name
			# drag originated from current zone
			if activeZone == @props.name
				DragAndDropState.WITHIN_ZONE
			else
				DragAndDropState.TO_OTHER_ZONE
		else
			if activeZone == @props.name
				# drag originated from another zone
				DragAndDropState.FROM_OTHER_ZONE
			else
				DragAndDropState.NONE

	_onDragEnter: (e) ->
		###
		We use this to keep track whether the current drag target is on this component
		###
		@_counter ?= 0
		@_counter++
		DragAndDropStore.setActiveZone(@props.name)
		@setState({dragAndDropState: @_getDragAndDropState()})

	_onDragLeave: (e) ->
		###
		Drag enter could fire multiply time so we need to use counter to track, only it because 0 means it left
		###
		@_counter--
		if @_counter == 0
			@_removePlaceHolder()
			@props.onDragLeave?()
			DragAndDropStore.setActiveZone()
			@setState({dragAndDropState: @_getDragAndDropState()})
			@_addClassOnBody(@props.noDroppingClass, false)

	_onDragStart: (index, e) ->
		###
		This will trigger onDrag callback if zone config has it, it will also use the effectedAllowed passed by the zone config
		In the payload, we will send the current index of the draggable element
		###
		e.dataTransfer.effectAllowed = @props.effectAllowed
		element = e.currentTarget
		dragPayload = @_getDragPayload(index, element)
		dragPayload.itemSize = @_getItemSize(@_elements[index])
		# This is to make firefox happy
		e.dataTransfer.setData("text", "")
		e.stopPropagation()
		if @props.useCustomDragImage && e.dataTransfer.setDragImage
			if @props.renderComponentDragImage
				@_mirrorTarget = document.createElement("ul");
				@_mirrorTarget.setAttribute("draggable", "true");
				@_mirrorTarget.classList.add("draggable")
				ReactDOM.render(@props.renderComponentDragImage(element), @_mirrorTarget)
			else
				@_mirrorTarget = element.cloneNode(true)
			@_mirrorTarget.classList.add("mirror-dragging")
			document.body.appendChild(@_mirrorTarget)
			e.dataTransfer.setDragImage(@_mirrorTarget, @_mirrorTarget.clientWidth/2, @_mirrorTarget.clientHeight)
		DragAndDropStore
			.setDragPayload(dragPayload)
			.setActiveZone(@props.name)
		@props.onDragStart?(dragPayload)
		@setState({
			draggingIndex: index
			dragAndDropState: @_getDragAndDropState()
		})
		setTimeout(=>
			$(element).addClass("#{@props.draghiddenClass} #{@props.draggingClass}")
		, 0)

	_onDragOver: (e) ->
		###
		When a zone got dragged over, we will figure out what is the index of current droppable element
		In the meantime, we will trigger callback of onDragOver from zone config by passing the drag/drop zone information
		Zone could also pass in renderPlaceHolder callback and we will show placeholder before/after the drop element to indicate the position
		###
		dragPayload = DragAndDropStore.getDragPayload()
		return if !dragPayload?
		{index, isPlaceholder} = @_findDragOverIndex(e)
		return if !index?
		dropDirection = @_getDropDirection(e, index)
		dragOverPayload = @_getDropPayloadWithAdjustedIndex(index, dropDirection, isPlaceholder)
		if @props.preventDrop?(dragPayload, dragOverPayload)
			@_addClassOnBody(@props.noDroppingClass, true)
			return
		@_addClassOnBody(@props.noDroppingClass, false)
		DragAndDropStore
			.setDragOverPayload(dragOverPayload)
			.setDropDirection(dropDirection)
		e.preventDefault()
		@props.onDragOver?(dragPayload, dragOverPayload, dropDirection, index)

		return if not @props.renderPlaceHolder? || isPlaceholder
		placeholderIndex = @_getPlaceHolderIndex(e, dragPayload.index, index)
		return if @state.placeholderIndex == placeholderIndex

		@setState({draggingOverIndex: index, placeholderIndex})

	_addClassOnBody: (className, isAdd) ->
		# The limitation on the drag and drop API is to not allow custom cursor while drag/drop#
		# To bypass this issue, we could append class on the body and override the whole body cursor#
		# Consumer who want to use custom cusor while no dropping is allowed should apply style on the body.no-dropping #
		document.body.classList.toggle(className, isAdd)

	_findIndexAmongChildren: (element) ->
		for child, i in @_elements when child?
			if ReactDOM.findDOMNode(child).contains(element)
				index = i
				break
		index

	_findDragOverIndex: (e) ->
		isPlaceholder = false
		index = @_findIndexAmongChildren e.target

		if @_placeholderDOM? && ReactDOM.findDOMNode(@_placeholderDOM).contains(e.target)
			index = @state.placeholderIndex
			isPlaceholder = true

		if @_isEmptyZone()
			index = 0

		if !index?
			# If drag over not in the list of elements or placeholder
			# It could be either the last element or the first element
			lastIndex = _.filter(@_elements).length - 1
			if @_getDropDirection(e, lastIndex) == DropDirection.AFTER
				index = lastIndex

			if @_getDropDirection(e, 0) == DropDirection.BEFORE
				index = 0

		{index, isPlaceholder}

	_onDrop: (e) ->
		dragPayload = DragAndDropStore.getDragPayload()
		return if !dragPayload
		dropDirection = DragAndDropStore.getDropDirection()

		DragAndDropStore
			.setDropped()
			.setActiveZone()
		e.preventDefault()
		dropPayload = DragAndDropStore.getDragOverPayload()
		if @_isFromSameZone()
			@_moveItemIfFromSameZone(@state.draggingIndex, dropPayload.index)
		else
			@_renderItemOnDropFromOtherZone(dropPayload)

		if @props.name == dragPayload.name
			# if dropping in a zone different from drag zone, dragEnd is not triggered automatically, need to
			# manually trigger it here to re-render the dragging zone
			dragPayload.component?._onDragEnd(dragPayload.index, null, dragPayload.element)
		
		if @props.isMultiSelectEnabled
			@_onDragEnd(dragPayload.index, null, dragPayload.element)

		@props.onDrop?(dragPayload, dropPayload)
		@_resetRenderState(dropPayload.index)
		@props.onDragLeave?()

	_onDragEnd: (index, e, element) ->
		###
		Whenever drag has finsihed or canceled, we will clear all the state
		###
		if !DragAndDropStore.isDropped()
			@props.onDropOutside?(DragAndDropStore.getDragPayload())
		else if @state.dragAndDropState == DragAndDropState.TO_OTHER_ZONE
			@_removeItem(@state.draggingIndex)
		@props.onDragEnd?()
		$(e.currentTarget).removeClass("#{@props.draghiddenClass} #{@props.draggingClass}") if e?
		$(element).removeClass("#{@props.draghiddenClass} #{@props.draggingClass}") if element?
		# clear drag status
		DragAndDropStore.setDragPayload()
		@_resetState()
		if @props.useCustomDragImage
			@_mirrorTarget?.parentNode.removeChild(@_mirrorTarget)
			@_mirrorTarget = null


	_updateChildren: (children, focus, focusIndex) ->
		if focus
			@setState({focusIndex:focusIndex})
		else
			@setState({children:@_getChildrenWithAddOnProps(children),focusIndex:focusIndex})

	_moveItem: (fromIndex, toIndex) ->
		children = @state.children.slice()
		itemToMove = children[fromIndex]
		children.splice(fromIndex, 1)
		children.splice(toIndex, 0, itemToMove)
		children

	_moveItemIfFromSameZone: (fromIndex, toIndex) ->
		children = @_moveItem(fromIndex, toIndex)
		@setState({focusIndex: toIndex, keyDownActiveIndex: toIndex, children: @_getChildrenWithAddOnProps(children)})

	_removeItem: (index) ->
		children = @state.children.slice()
		children.splice(index, 1)
		@setState({focusIndex: -1, keyDownActiveIndex: -1, children: @_getChildrenWithAddOnProps(children)})

	_renderItemOnDropFromOtherZone: (dropPayload) ->
		return if !@props.renderItemOnDropFromOtherZone?
		toIndex = if @state.placeholderIndex >= 0 then @state.placeholderIndex else dropPayload.index
		children = @state.children.slice()
		children.splice(toIndex, 0, @props.renderItemOnDropFromOtherZone(DragAndDropStore.getDragPayload(), dropPayload))
		@setState({focusIndex: toIndex, keyDownActiveIndex: toIndex, children: @_getChildrenWithAddOnProps(children)})

	_resetState: ->
		DragAndDropStore.reset()
		@_resetRenderState()

	_resetRenderState: (focusIndex) ->
		@_counter = 0
		@setState(
			focusIndex: focusIndex || @state.focusIndex
			draggingIndex: -1
			draggingOverIndex: -1
			placeholderIndex: -1
			keyDownActiveIndex: -1
			dragAndDropState: DragAndDropState.NONE
		)

	_getDropIndex: (index, isPlaceHolder, dropDirection) ->
		###
		isPlaceHolder is true when the drop is directly on the placeholder element.
		We need to offset the dropIndex by 1 when dragIndex < dropIndex since the current draggable element is taking one.

		For multi-select the drop index adjustment is not in any use case yet, and this method's expected behavor is TBD
		###
		dragPayload = DragAndDropStore.getDragPayload()
		isDroppingAfter = dropDirection == DropDirection.AFTER
		index = @props.getChildDropIndex(index, @state.children, isDroppingAfter, isPlaceHolder)
		isSameInteractionZone = @_isFromSameZone() || @_isFromSameInteractionZone(index)
		return index if (dragPayload.index < 0 && isSameInteractionZone) or index is null

		# Only use index assuming it is a single-select case
		{dragIndex, dropIndex} = (@props.getGlobalDragAndDropIndices || @defaultGetGlobalDragAndDropIndices)(dragPayload, index)
		if isPlaceHolder
			index = @state.placeholderIndex
			# When the drag starts, the dragged pill is hidden, but remains in the child array (@props.draghiddenClass)
			# Therefore, placeholderIndex is the true child drop index and isDroppingAfter can be ignored.
			if dragIndex < dropIndex && isSameInteractionZone
				index--
		else if isSameInteractionZone
			if dragIndex < dropIndex && !isDroppingAfter
				index--
			if dragIndex >= dropIndex && isDroppingAfter
				index++
		else if isDroppingAfter
			# dragging from a different zone and the drop target is after the drop column
			index++

		index

	_detectItemsSize: ->
		@_itemsSize =
			if @_elements.length
				_.filter(@_elements).map (element) => @_getItemSize(element)
			else
				[]
	_startAnimation: ->
		return if !@_isVisible()
		if @props.isDraggable
			# disable dragging images and links outside of parent elements
			$(ReactDOM.findDOMNode(@)).find("img").attr("draggable", false);
			$(ReactDOM.findDOMNode(@)).find("a").attr("draggable", false);
		if @props.useGPUAnimation
			@_startGPUAnimation()
		else if @props.hasAnimation
			@_positionItems()

	_positionItems: ->
		@_detectItemsSize()

		itemsSize = @_itemsSize
		itemSpacing = @props.itemSpacing
		dragIndex = @state.draggingIndex
		dropIndex = @state.placeholderIndex
		dragAndDropState = @state.dragAndDropState

		# element being dragged should take the same space it occupies when attemping
		# to drop at another section
		placeHolderSize = @props.placeholderSize || DragAndDropStore.getDragPayload()?.itemSize

		isOnItem = DragAndDropStore.getDragOverPayload()?.direction == DropDirection.ON

		if dragAndDropState == DragAndDropState.WITHIN_ZONE
			# drop around the dragged element, not showing placeholder but actual dropIndex should be dragIndex
			dropIndex = dragIndex if dropIndex == -1
		else if dragAndDropState == DragAndDropState.FROM_OTHER_ZONE
			# drag from other zone and drop at an item in current zone, placeholder not showing, so -1 but
			# actual target drop index should be draggingOverIndex
			dropIndex = @state.draggingOverIndex if isOnItem

		# update top level list total height
		numChildren = @state.children.length
		topLevel = ReactDOM.findDOMNode(@)
		height = dragAndDropState.getSize(itemsSize, itemSpacing, placeHolderSize, dragIndex, isOnItem)

		$(topLevel).css({height, position: "relative"})

		# position each item
		for child, i in @_elements when child?
			top = dragAndDropState.getItemPosition(i, itemsSize, itemSpacing, placeHolderSize, dragIndex, dropIndex, isOnItem)
			$(ReactDOM.findDOMNode(child)).css({top, position: "absolute"})

			if isOnItem && i == dropIndex
				$(ReactDOM.findDOMNode(child)).addClass(@props.dragOverClass)
			else
				$(ReactDOM.findDOMNode(child)).removeClass(@props.dragOverClass)

		# position placeholder
		if dragAndDropState != DragAndDropState.NONE && @_placeholderDOM?
			$(ReactDOM.findDOMNode(@_placeholderDOM)).css({
				top: dragAndDropState.getPlaceholderPosition(itemsSize, itemSpacing, dragIndex, dropIndex)
				position: "absolute"
			})

	_startGPUAnimation: ->
		showPlaceHolderClass = "show-placeholder"
		topLevel = ReactDOM.findDOMNode(@)
		topLevel.style.position = "relative"
		placeHolderSize = @props.placeholderSize || DragAndDropStore.getDragPayload()?.itemSize
		for child, i in @_elements when child?
			childDOM = ReactDOM.findDOMNode(child)
			tranformStyle =
				if i >= @state.placeholderIndex && @state.placeholderIndex != -1
					"translate(0, #{placeHolderSize + @props.itemSpacing}px"
				else
					"initial"

			childDOM.style.transform = tranformStyle

		# position placeholder
		if @_placeholderDOM? && !ReactDOM.findDOMNode(@_placeholderDOM).style.position
			ReactDOM.findDOMNode(@_placeholderDOM).style.position = "absolute"
		dragElement = DragAndDropStore.getDragPayload()?.element
		dragElement?.classList.toggle(showPlaceHolderClass, @_placeholderDOM?)
		ReactDOM.findDOMNode(@).classList.toggle(showPlaceHolderClass, @_placeholderDOM?)

	_getBoundingRect: (el) ->
		ReactDOM.findDOMNode(el).getBoundingClientRect()

	_getItemSize: (el) ->
		rect = @_getBoundingRect(el)
		if @_isVertical()
			rect.height
		else
			rect.width

	_isFromSameZone: ->
		dragPayload = DragAndDropStore.getDragPayload()
		dragPayload?.name == @props.name

	_isFromSameInteractionZone: (index) ->
		###
		The use case is that sometimes information are present in both of the zones
		However they should belong to the same interactionZone, that's why we will need to
		Compare whether the two zones are the same

		For example: Zone A1 has column B, Zone A2 also has column B
		When dragging column B from A1 to A2, they should have the same interactionZoneName
		So that DragAndDropRC knows that this is a duplicate information

		For multiple dragged items, return true if all items are from the same zone; false otherwise
		###
		dragPayload = DragAndDropStore.getDragPayload()

		if dragPayload.items?.length > 0
			for item in dragPayload.items
				return false if @props.getInteractionZoneName(index) != item.interactionZoneName
			return true

		(dragPayload.interactionZoneName || dragPayload.name) == @props.getInteractionZoneName(index)



	_getDragPayload: (index, element) ->
		# the drag payload is generally the same as drop payload, but may also contain additional metadata

		index = @_findIndexAmongChildren element

		payload = @_getDropPayload(index)
		payload.element = element
		@props.setExtraDragPayload?(payload)
		payload

	_getDropPayload: (index, direction, originalIndex, isKeyboard) ->
		DragAndDropStore.makePayload({
			index
			originalIndex
			name: @props.name
			component: @
			direction
			isKeyboard
			# prefer originalIndex because it was not adjusted for direction
			interactionZoneName: @props.getInteractionZoneName(if _.isNumber(originalIndex) then originalIndex else index)
		})

	_getDropPayloadWithAdjustedIndex: (index, direction, isPlaceHolder) ->
		@_getDropPayload(
			@_getDropIndex(index, isPlaceHolder, direction)
			direction
			@props.getChildDropIndex(index, @state.children, direction == DropDirection.AFTER, isPlaceHolder)
		)

	_getPlaceHolderIndex: (e, dragIndex, index) ->
		return -1 if dragIndex == index and @_isFromSameZone()
		return 0 if @_isEmptyZone()
		if @props.getPlaceholderPosition && @props.getPlaceholderPosition() != -1
			return @props.getPlaceholderPosition()
		DragAndDropStore.getDropDirection()?.getPlaceHolderIndex(index)

	_getDropDirection: (e, index) ->
		###
		Based on the current element bounding client and drag position also the zone configuration direction(horizontal or vertical)
		This method is going to set whether the insertion happens before, after or at the target element
		###
		if @_isEmptyZone() || !@_elements[index]?
			DropDirection.AFTER
		else
			element = ReactDOM.findDOMNode(@_elements[index])
			rect = element.getBoundingClientRect()
			if @_isVertical()
				@_calculateDropDirection(e.clientY, rect.top, rect.height)
			else
				# clientX and rect.left are always calculated relative to left edge of viewport, even in RTL mode
				@_calculateDropDirection(e.clientX, rect.left, rect.width)

	_calculateDropDirection: (position, offset, size) ->
		alpha = 0.1
		direction =
			if @_isFromSameZone() || !@props.allowDropOnItem
				if position > offset + size / 2
					DropDirection.AFTER
				else
					DropDirection.BEFORE
			else
				if position > offset + size * (1 - alpha)
					DropDirection.AFTER
				else if position < offset + size * alpha
					DropDirection.BEFORE
				else
					DropDirection.ON

		# Flip drop direction if in RTL mode since position and offset are always given relative to LTR perspective
		if @_isRtl() && !@_isVertical()
			if direction is DropDirection.AFTER
				direction = DropDirection.BEFORE
			else if direction is DropDirection.BEFORE
				direction = DropDirection.AFTER
		direction

	_isEmptyZone: ->
		_.isEmpty(@state.children)

	_isVisible: ->
		$(ReactDOM.findDOMNode(@)).is(":visible")

	_isRtl: ->
		@context is LanguageDirectionUtil.RTL

DragAndDropRC.contextType = UNSAFE_DirectionSettings
