
Enum = require("Common/src/lang/Enum.coffee")
# needs a minimum height for drop area to catch drop event
MIN_DROP_AREA_HEIGHT = 4

module.exports = class DropDirection extends Enum
	###
	Enum representing drag and drop state for current section
	@author alice.chen
	###
	getPlaceHolderIndex: (index) ->
		@_value.getPlaceHolderIndex(index)

DropDirection.build(DropDirection,
	BEFORE:
		getPlaceHolderIndex: (index) -> index

	ON:
		getPlaceHolderIndex: (index) -> -1

	AFTER:
		getPlaceHolderIndex: (index) -> index + 1
)
