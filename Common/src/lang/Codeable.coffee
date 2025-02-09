_ = require("lodash")

Errors = require("Common/src/util/Errors.coffee")
Enum = require("Common/src/lang/Enum.coffee")

module.exports = class Codeable extends Enum
	###
	Pretty much an enum that can be mapped to a optionally case sensitive string code.

	@deprecated Use Codeable.js going forward
	@author zuye.zheng
	###

	### Override this to false if the codeable should be case insensitive. ###
	@_isCaseSensitive = true

	@getDefaultValue: (code) ->
		### Implement this if there is a default value if the code is not found or invalid. Otherwise error out. ###
		throw new Error("Cannot find enum for code '#{code}'.")

	@getEnumByCode: (code) ->
		### Get an enum by code. ###
		code = code.toLowerCase() if code? and !@_isCaseSensitive
		curEnum = @_enumsByCode[code]

		if curEnum? then curEnum else @getDefaultValue(code)

	@getAllCodes: ->
		### Return all codes as an array. ###
		curEnum.getCode() for curEnum in @enums()

	@hasCode: (code) ->
		### If the current codeable has the given code. ###
		code = code?.toLowerCase() if !@_isCaseSensitive

		_.has(@_enumsByCode, code)

	@_registerMore: (curEnum) ->
		### Register another map with the codes. ###
		@_enumsByCode ?= {}

		# figure out the code and if it is unique
		curCode = curEnum.getCode()
		throw new Error("Duplicate code '#{curCode}'.") if @hasCode(curCode)

		# normalize the code before storing the enum if not case-sensitive
		curCode = curCode?.toLowerCase() if !@_isCaseSensitive
		@_enumsByCode[curCode] = curEnum

	getCode: ->
		### Return the code for the enum, must be implemented. ###
		Errors.checkImplemented()
