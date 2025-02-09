_ = require("lodash")

module.exports = class LayoutUtil
	###
	A utility that handles layouts and layout accessories. The main features are compaction, reflow, and hit detection.

	Note that everything in a layout you are using this utility on is assumed to follow the PlaceholderItem API.
	###

	constructor: (@_flowUp = true) ->
		###
		When @_flowUp=true, this class will use gravity at the top for placing items.  When false, it will not use any
		gravity and empty space will be preserved on the layout when placing items.
		###

	@sortLayout: (itemLayout) ->
		###
		Sorts layout such that things above others come first, then things to the left come before things to the right.
		Useful because with reflow upward, you can work forward and not have to worry about anything.
		###

		itemLayout.sort((a,b) ->
			if a.getRow() == b.getRow()
				a.getColumn() - b.getColumn()
			else
				a.getRow() - b.getRow()
		)

	@createBoundingBox = (itemList) ->
		###
		Creates a minimal bounding box around the items in the list
		returns undefined if no items passed in, check before using this function
		###
		if itemList.length < 1
			return undefined

		minX = minY = Infinity
		maxX = maxY = -Infinity

		for item in itemList
			minY = Math.min(item.getRow(), minY)
			minX = Math.min(item.getColumn(), minX)
			maxY = Math.max(item.getRow() + item.getHeight(), maxY)
			maxX = Math.max(item.getColumn() + item.getWidth(), maxX)

		new LayoutUtil.PlaceholderItem({column: minX, row: minY, width: maxX - minX, height: maxY - minY})

	@overlap: (item1, item2) ->
		### Overall hit detection function. ###
		@overlapHorizontally(item1, item2) and @overlapVertically(item1, item2)

	@inside: (container, contained) ->
		### Check if contained is inside container ###
		# contained can be position or widget, if it's widget get postion
		if typeof contained.getPosition is 'function'
			contained = contained.getPosition()
		(container.getRow() <= contained.row and
		container.getRow() + container.getHeight() >= contained.row + contained.height and
		container.getColumn() <= contained.column and
		container.getColumn() + container.getWidth() >= contained.column + contained.width)

	@allInside: (
		# Either a GridLayoutWidget or a Position representing the container's location/size
		container,
		# Array of all contained items items to check (objects must have row/column/height/width parameters, e.g.
		# PlaceholderItem). Can use the array returned from getContainedItems() here.
		allContained
	) ->
		###
		Check if all contained items are inside the given container.
		###
		for contained in allContained
			if !@inside(container, contained)
				return false
		true

	@getContainedItems: (
		# GridLayoutWidget for container
		containerWidget,
		# New position of container (object must have row/column parameters, e.g. PlaceholderItem)
		newPosition
	) ->
		###
		Get a PlaceholderItem array representing the new locations of the widgets contained in a container, if the container
		were to move to newPosition.  The returned array can be empty, but not undefined/null.
		###
		return [] if !containerWidget.getContainedWidgets()?

		oldPosition = containerWidget.getPosition()
		delta =
			row: oldPosition.row - newPosition.row
			column: oldPosition.column - newPosition.column

		placeholders = []
		for containedWidget in containerWidget.getContainedWidgets()
			# move all of the contained widgets the same delta that the container moved
			widgetOldPosition = containedWidget.getPosition()
			placeholders.push(new LayoutUtil.PlaceholderItem(
				row: widgetOldPosition.row - delta.row
				column: widgetOldPosition.column - delta.column
				width: widgetOldPosition.width
				height: widgetOldPosition.height
			, containedWidget.getUID()
			))
		placeholders

	@overlapHorizontally: (item1, item2) ->
		### Tell if two items occupy the same space horizontally. ###
		!(item1.getColumn() + item1.getWidth() <= item2.getColumn()) and !(item1.getColumn() >= item2.getColumn() + item2.getWidth())

	@overlapVertically: (item1, item2) ->
		### Tell if two items occupy the same space vertically. ###
		!(item1.getRow() + item1.getHeight() <= item2.getRow()) and !(item1.getRow() >= item2.getRow() + item2.getHeight())

	@specifiedDoesntOverlap: (items, item) ->
		### Given a layout and an item, check to see if the item overlaps anything in the layout. ###
		not _.some(items, (i) => @overlap(i, item))

	@rtlFlipLayout: (itemList, numColumns) ->
		###
		Takes the given item list and a number of columns
		Creates a new list where the items are reflected w.r.t. a vertical line in the middle of the specified columns
		Doesn't worry about giving negative values, so make sure you give the correct number of columns
		###
		newItemList = []
		for item in itemList
			newItemList.push(new LayoutUtil.PlaceholderItem({
				column: numColumns - item.getColumn() - item.getWidth(),
				row: item.getRow(),
				width: item.getWidth(),
				height: item.getHeight()
			}, item.getUID()))

		newItemList

	moveAndGetProxyLocation: (itemLayout, itemToMove, newPosition, preCompact = false, injectItemFirst = false) ->
		###
		Injects the specified item into the layout at the specified position. The position is specified as
		an object with a column, row, width, and height property. Returns the location of where the item
		would be placed and the position the other items would be moved to. Like other functions, these
		positions are mapped to items by UID.

		See _injectItem() to get a description for the injectItemFirst parameter.
		###

		# remove the item we're trying to move so it doesn't collide with itself
		index = itemLayout.indexOf(itemToMove)
		if index > -1
			itemLayout.splice(index, 1)

		newLayout = if preCompact then @compactedLayout(itemLayout) else itemLayout

		newLayout = @_injectItem(newLayout, itemToMove, newPosition, injectItemFirst)

		# put the item back in
		if index > -1
			itemLayout.push(itemToMove)

		for item in newLayout
			if item.getUID() is itemToMove.getUID()
				proxyPosition = item.getPosition()
				newLayout.splice(newLayout.indexOf(item), 1)
				break

		{changedLayout: newLayout, proxyPosition: proxyPosition}

	_injectItem: (itemLayout, itemToInject, atPosition, injectItemFirst = false) ->
		###
		Injects an item at the highest compacted spot available. Like the other functions in this util, it returns a
		list of placeholder items with the new positions, and items inherit the UID of the item it's a placeholder
		for.

		The best way to describe the algorithm is is to view the items in the layout as bricks. You are trying to
		build a wall, but want a certain brick as close to a certain place as possible and can only move bricks
		directly up. However, you want to move as few bricks as possible, so you find the highest brick that starts
		under where you want the specified brick to start and would intersect with the specified brick and place
		the specified brick above that brick. If you want the brick on the ground, you just put it there and move
		everything above it up as needed.

		When injectItemFirst=true, the itemToInject will be the very first item placed on the layout, causing all other
		items to reflow around it.  When false, the itemToInject will be placed on the layout according to it's location on
		the grid (i.e., items placed at locations higher on the grid will be placed on the layout first), meaning it will
		not get preferential reflow treatment.
		###

		injectRow = atPosition.row
		sortedLayout = LayoutUtil.sortLayout(itemLayout)
		partialCompaction = []
		index = -1

		if injectItemFirst
			index = 0 # force the item to be the first on the layout, so all other items reflow around it
		else
			for item, i in sortedLayout
				if item.getRow() < atPosition.row
					@_addToPartial(partialCompaction, item)
					if LayoutUtil.overlapHorizontally(item, itemToInject)
						injectRow = Math.max(injectRow, item.getRow() + item.getHeight())
				else
					index = i
					break

		@_addToPartial(partialCompaction, new LayoutUtil.PlaceholderItem(
			column: atPosition.column
			row: injectRow
			height: atPosition.height
			width: atPosition.width
		, itemToInject.getUID()))

		if index isnt -1
			for item, i in sortedLayout.slice(index)
				@_addToPartial(partialCompaction, item)

		partialCompaction

	compactedLayout: (itemLayout) ->
		###
		Takes a layout and returns a new compacted version of the layout with placeholders having the new positions.
		The compaction is defined by what the final state would be if there was gravity at the top (and only the top).
		The placeholders will have the UID of the items contained within so you can match items to new positions.
		###

		sortedLayout = LayoutUtil.sortLayout(itemLayout)
		partialCompaction = []
		for item in sortedLayout
			@_addToPartial(partialCompaction, item)

		partialCompaction

	_addToPartial: (layout, itemToAdd) ->
		###
		Given a partial layout of placeholders, add a new placeholder to the first available row.
		The PlaceholderItem also has the UID of the widget added to the layout.
		###

		newRow = @getFirstAvailableRow(layout, itemToAdd)

		layout.push(new LayoutUtil.PlaceholderItem(
			column: itemToAdd.getColumn()
			row: newRow
			width: itemToAdd.getWidth()
			height: itemToAdd.getHeight()
		, itemToAdd.getUID()))

	getFirstAvailableRow: (layout, item) ->
		###
		This function finds the first available row where the item could be placed in the layout.  This row can be different
		depending on the options given when creating this class:
		- When flowUp=true, it finds the least row that is under everything that the given item horizontally overlaps in the layout.
		- When flowUp=false, it returns the row of the item itself, if the item does not overlap other items (then it finds the least non-overlapping row).
		###

		placeholder = new LayoutUtil.PlaceholderItem({column: item.getColumn(), width: item.getWidth()})
		row = 0

		hasOverlap = false # keep track of overlap for use in the flowUp = false scenario
		for thing in layout
			hasOverlap = hasOverlap || LayoutUtil.overlap(item, thing)
			if LayoutUtil.overlapHorizontally(placeholder, thing)
				row = Math.max(row, thing.getRow() + thing.getHeight())

		if !@_flowUp && !hasOverlap
			row = item.getRow()

		row

class LayoutUtil.PlaceholderItem
		### Helper class for the utilities. ###

		constructor: ({@column, @row, @width, @height}, @id="") ->

		getColumn: ->
			@column

		getRow: ->
			@row

		getHeight: ->
			@height

		getWidth: ->
			@width

		getUID: ->
			@id

		getPosition: ->
			{@column, @row, @width, @height}
