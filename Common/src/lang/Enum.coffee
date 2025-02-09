_ = require("lodash")

module.exports = class Enum
	###
	Java like enum structure that supports both ordinals, names and retrieving by name. Start by creating a class that
	extends Enum and calling the static build Enum.build() with an array of name string or a name value map:

	class MyEnum1 extends Enum
	MyEnum1.build(MyEnum1, [
		"Item1"
		"Item2"
	])

	class MyEnum2 extends Enum
	MyEnum2.build(MyEnum2,
		Item1: "foo"
		Item2: "bar"
	)

	This will result in an Enum class where enum items can be accessed via the class:

	MyEnum.Item1
	MyEnum.Item2
	MyEnum.enums()

	Items will be instances of the Enum subclass. Ordinal relies on the undocumented fact that JS iterates maps in
	deterministic order.

	To extend building of enums for custom logic implement static method registerMore(enum) which will be called for
	every enum built.
	@deprecated Use Enum.js going forward
	@author zuye.zheng
	###

	@build: (EnumClass, enumDefs={}) ->
		# build the items
		curOrdinal = 0
		if _.isArray(enumDefs)
			@_ENUMS = for curName in enumDefs
				new EnumClass(curOrdinal++, curName)
		else if _.isPlainObject(enumDefs)
			@_ENUMS = for curName, curValue of enumDefs
				new EnumClass(curOrdinal++, curName, curValue)
		else
			# assume it is a Map in the else case because there is no easy way to test if the incoming definition
			# is a Map type due to our hybrid build of ES6 and CoffeeScript
			@_ENUMS = []
			enumDefs.forEach((value, key) =>
				@_ENUMS.push(new EnumClass(curOrdinal++, key, value))
			)

		@_size = curOrdinal

		# build some other stuff to make using enums easier
		@_ENUMS_BY_NORMALIZED_NAME = {}
		for curEnum in @_ENUMS
			normalizedName = curEnum.getName().toLowerCase()
			throw new Error() if @_ENUMS_BY_NORMALIZED_NAME[normalizedName]?
			EnumClass[curEnum.getName()] = curEnum
			@_ENUMS_BY_NORMALIZED_NAME[normalizedName] = curEnum

			# if the enum class implemented registerMore, call it
			EnumClass._registerMore?(curEnum)

		EnumClass

	@enums: ->
		### Static accessor to get all the items. ###
		@_ENUMS

	@getEnumByName: (name, strict) ->
		### Get an enum by name, use strict to enforce case sensitivity. ###
		if strict then @[name] else @_ENUMS_BY_NORMALIZED_NAME[name.toLowerCase()]

	@getEnumByValue: (value, strict) ->
		### Get first matching enum by value, use strict to enforce case sensitivity. ###
		for curEnum in @_ENUMS
			curValue = curEnum._value
			if @_normalizeValue(value, strict) == @_normalizeValue(curValue, strict)
				return curEnum

	@getEnumByOrdinal: (ordinal) ->
		### Get an enum by ordinal. ###
		@_ENUMS[ordinal]

	@hasEnumWithName: (name, strict) ->
		### Return true if enum exists with given name, false otherwise. ###
		@getEnumByName(name, strict)?

	@hasEnumWithValue: (value, strict) ->
		### Return true if enum exists with given value, false otherwise. ###
		@getEnumByValue(name, strict)?

	@size: ->
		### Number of enums. ###
		@_size

	constructor: (@_ordinal, @_name, @_value) ->

	getOrdinal: -> @_ordinal

	isFirst: ->
		### If the first enum by ordinal. ###
		@_ordinal == 0

	isLast: ->
		### If the last enum by ordinal. ###
		@_ordinal == @constructor.size() - 1

	getPrevious: ->
		### Get the previous enum in order or undefined if this is the first. ###
		@constructor.getEnumByOrdinal(@getOrdinal() - 1) if !@isFirst()

	getNext: ->
		### Get the next enum in order or undefined if this is the last. ###
		@constructor.getEnumByOrdinal(@getOrdinal() + 1) if !@isLast()

	getName: -> @_name

	getValue: -> @_value

	@_normalizeValue: (value, strict) ->
		if !strict && typeof value == "string" then value.toLowerCase() else value

