module.exports = class ES6PromiseDeferred
	###
	Base implementation of Deferred build on top of an ES6 Promise. Mimics the Promise API for the most part.

	@DEPRECATED: Use Promise instead.

	a deferred is an object with:
	- a promise
	- a function resolve(<val>): function to call to resolve the promise
	- a function reject(<val>): function to call to reject the promise

	Why, oh why isn't this simple class part of the es6 standard
	is a mystery to me. -Didier 2/14/2015
	###

	constructor: ->
		@_promise = new Promise((@_resolve, @_reject) =>)

	resolve: =>
		@_resolve(arguments...)
		@

	reject: =>
		@_reject(arguments...)
		@

	then: (successCallback, errorCallback) =>
		@_promise.then(successCallback, errorCallback)

	catch: (callback) ->
		@_promise.catch(callback)

	finally: (callback) =>
		@then(
			(result) ->
				callback(result)

				result
			(error) ->
				callback(error)

				throw error
		)

	promise: -> @_promise
