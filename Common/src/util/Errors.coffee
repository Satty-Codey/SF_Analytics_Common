_ = require("lodash")

module.exports = Errors =
	###
	Factory of errors.

	@author zuye.zheng
	###

	notImplemented: -> new Error("Not implemented.")

	checkImplemented: -> throw @notImplemented()

	checkRequired: (name, argument, strict) ->
		###
		Check that the argument of the given name is present. Strict does a further check of empty strings, arrays, and
		objects.
		###
		return if !__LOCALHOST__

		if !argument? || strict && ((_.isArray(argument) || _.isObject(argument)) && _.isEmpty(argument))
			throw new Error("Missing required argument '#{name}'.")

	checkOfType: (name, argument, expectedType, required) ->
		###
		Check that the argument is of expectedType unless null or undefined. Strict if argument is required.
		###
		return if !__LOCALHOST__

		# Re-implement these simple checks rather than introduce a dep on React here.
		if not argument instanceof expectedType
			throw new Error("Argument `#{name}` is of an invalid type. Expected #{expectedType}.")
		if required and !argument?
			throw new Error("Argument `#{name}` is required.")
