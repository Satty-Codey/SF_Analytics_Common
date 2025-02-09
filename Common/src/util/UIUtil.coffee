_ = require("lodash")

Range = require("Common/src/math/Range.js").default

module.exports = UIUtil =
	###
	Common UI utilities.

	@author zuye.zheng
	###

	selectEntireInputContents: (inputEl) ->
		###
		Highlight the entire text input on focus
		###
		inputEl.setSelectionRange(0, inputEl.value.length)

	isMouseInElement: (event, element) ->
		###
		Return true if the mouse coordinates of the event are within the bounds of the specified element.
		Element can be either a DOM or jQuery element.
		###
		element = element[0] if element.jquery
		{top, left} = element.getBoundingClientRect()

		@isPositionInCoords(event.clientX, event.clientY, {
			top
			left
			height: element.clientHeight
			width: element.clientWidth
		}, false)

	isPositionInCoords: (posX, posY, {top, left, height, width}, inclusive = true) ->
		###
		Return true if the x, y position given is within the bounds
		given by top, left, height, and width (inclusive or exclusive)
		###
		new Range(left, (left + width), inclusive).inBounds(posX) &&
		new Range(top, (top + height), inclusive).inBounds(posY)

	isMousePositionValid: (event) ->
		###
		Chrome seems to have a bug where it will sometimes set all the mouse position values in an event to 0
		so a mouse position is only valid if they are all greater than 0
		###
		return event.clientX > 0 && event.clientY > 0 &&
			event.pageX > 0 && event.pageY > 0 &&
			event.screenX > 0 && event.screenY > 0

	distributeFullPixels: (pixels, numOfSlices) ->
		### Distribute the given number of pixels into N slices as evenly as possible and ensure full pixels. ###
		pixelsPerSlice = pixels / numOfSlices
		fullPixelsPerSlice = Math.floor(pixelsPerSlice)

		# create the results array
		slices = []
		for [1..numOfSlices]
			slices.push(fullPixelsPerSlice)

		# if uneven distribution, distribute remaining pixels
		if pixelsPerSlice != fullPixelsPerSlice
			remainingPixels = pixels - (pixelsPerSlice * numOfSlices)
			for i in [1..remainingPixels]
				slices[i]++

		slices

	getScrollParent: (node) ->
		if !node?
			return null
		if node.scrollHeight > node.clientHeight
			node
		else
			UIUtil.getScrollParent(node.parentNode)

	scrollIntoView: (element, alignToTop)->
		hasIfNeedFunc = typeof element?.scrollIntoViewIfNeeded == "function"

		if hasIfNeedFunc then element.scrollIntoViewIfNeeded(alignToTop) else element?.scrollIntoView?(alignToTop)

	scrollToElement: (element) ->
		###
		Alternative to scrollIntoView which does not use the native scrollIntoView/scrollIntoViewIfNeeded as it
		scrolls strangely.  Calculates the offsets and positions the scroll position based on the element's position
		inside its parent.  This requires the parent to have the position: relative style set on it.
		###
		return if !element?

		parent = element.parentElement

		elementTop = element.offsetTop
		elementBottom = elementTop + element.offsetHeight

		parentHeight = parent.offsetHeight
		parentScrollTop = parent.scrollTop

		if elementBottom > parentScrollTop + parentHeight
			parent.scrollTop = Math.max(0, elementBottom - parentHeight)
		else if elementTop < parentScrollTop
			parent.scrollTop = elementTop

	buildClassName: (classNames...) ->
		###
		Build a single class name string given class names as arguments, this will skip null, undefined, and empty class
		names. This is to make it easy to specify optional additional class names.
		###
		for curClassName in classNames
			# skip empties
			continue if _.isEmpty(curClassName)
			if className?
				className += " " + curClassName
			else
				className = curClassName

		className

	classSet: (classMap) ->
		classes = []
		for className, hasClass of classMap
			classes.push(className) if hasClass
		@buildClassName(classes...)


	# Used to translate all wheel event to a simple x/y offset
	wheelEventToPixelOffset: (event) ->
		if event.deltaMode?
			multiplier = switch event.deltaMode
				when 0 then 1   # Pixel distance
				when 1 then 40  # Line distance
				when 2 then 800 # Page distance
			x: event.deltaX * multiplier, y: event.deltaY * multiplier
		else
			#legacy browser support, not entirely sure the detail on these rules, found them online
			# never applies to any modern browser as event.deltaMode? is true
			ticks = x: 0, y: 0
			ticks.y = event.detail if event.detail?
			ticks.y = -event.wheelDelta / 120 if event.wheelDelta?
			ticks.y = -event.wheelDeltaY / 120 if event.wheelDeltaY?
			ticks.x = -event.wheelDeltaX / 120 if event.wheelDeltaX?
			ticks = {x: ticks.y, y: 0} if event.axis? and event.axis is event.HORIZONTAL_AXIS
			x: ticks.x * 10, y: ticks.y * 10 # Pixel distance per wheel tick

	# Determines the width of scrollbars for dynamic rendering of some scrollers
	# Translated from http://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
	getScrollbarWidth: ->
		outer = document.createElement("div")
		outer.style.visibility = "hidden"
		outer.style.width = "100px"
		outer.style.msOverflowStyle = "scrollbar" # needed for WinJS apps

		document.body.appendChild(outer)

		widthNoScroll = outer.offsetWidth
		# force scrollbars
		outer.style.overflow = "scroll"

		# add innerdiv
		inner = document.createElement("div")
		inner.style.width = "100%"
		outer.appendChild(inner)

		widthWithScroll = inner.offsetWidth

		# remove divs
		outer.parentNode.removeChild(outer)

		#Self Memoizing to cache results
		@getScrollbarWidth = ->
			widthNoScroll - widthWithScroll

		@getScrollbarWidth()

	getOffset: (element) ->
		box = element.getBoundingClientRect()
		top = box.top + window.pageYOffset - document.documentElement.clientTop
		left = box.left + window.pageXOffset - document.documentElement.clientLeft
		{top, left}
