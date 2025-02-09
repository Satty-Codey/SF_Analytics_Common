ES6PromiseDeferred = require('Common/src/util/ES6PromiseDeferred.coffee')
_ = require("lodash")

module.exports = DeferredUtil =

	###
	Like Promise.all, except return a deferred that is resolved/rejected
	only when all it's argument deferreds have completed, as opposed to
	Promise.all that will return immediately if an argument deferred fails.

	Also marks failed xhr requests as handled so that our top level error handling
	is not triggered

	TODO: Replace with Promise.allSetted.
	###
	whenAll: ->
		masterDef = new ES6PromiseDeferred()
		count = arguments.length
		return Promise.resolve() if not count
		error = undefined
		for def in arguments
			def.then(
				->
					if not --count
						if error then masterDef.reject(error) else masterDef.resolve()
				(arg) ->
					error ?= arg
					masterDef.reject(error) if not --count
			)
		masterDef.promise()
