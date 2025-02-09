module.exports = EventUtil =

	###
	Util to to handle events
	A copy from SLDS event util

	@author y.qi
	###

	_trapEvent: (event) ->
		return if !event
		event.preventDefault()
		event.stopPropagation()
		event.nativeEvent?.preventDefault?()
		event.nativeEvent?.stopPropagation?()

	trap: (event) ->
		@_trapEvent(event)

	trapImmediate: (event) ->
		event.stopImmediatePropagation?()
		event.nativeEvent?.stopImmediatePropagation?()
		@trap(event)