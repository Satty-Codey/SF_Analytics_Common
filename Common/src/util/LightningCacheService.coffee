_ = require("lodash")

module.exports = class LightningCacheService

	###
	Service to cache report query results to minimize the number of API calls that we have to make

	@author timothy.murray
	@since 210
	###

	constructor: (@_maxQueries) ->
		@reset()

	reset: (resetBooleanFilter = true) ->
		@_cachedResults = {}
		@_resultQueue = []
		@_cachedBooleanFilter = {} if resetBooleanFilter
		@_cachedNoEvictionResults = {}

	getResult: (key) ->
		# only accept strings as keys
		if typeof key is "string"
			result = @_cachedResults[key]

			# move this query to the back of the queue
			if result?
				_.pull(@_resultQueue, key)
				@_resultQueue.push(key)

		result

	addResult: (key, value) ->
		# only accept strings as keys
		if typeof key is "string"
			@_cachedResults[key] = value
			@_resultQueue.push(key)

			if @_maxQueries? and @_resultQueue.length > @_maxQueries
				removeVal = @_resultQueue.shift()
				delete @_cachedResults[removeVal]

	clearResult: (key) ->
		# Clear result for specified key
		if key
			if @_cachedResults[key]
				delete @_cachedResults[key]
			_.pull(@_resultQueue, key)

	addNoEvictionResult: (key, value) ->
		# only accept strings as keys
		if typeof key is "string"
			@_cachedNoEvictionResults[key] = value

	getNoEvictionResult: (key) ->
		# only accept strings as keys
		if typeof key is "string"
			result = @_cachedNoEvictionResults[key]
		result

	getBooleanFilter: (key='default') ->
		result = @_cachedBooleanFilter[key]
		if result then result else null

	setBooleanFilter: (value, key='default') ->
		@_cachedBooleanFilter[key] = value
