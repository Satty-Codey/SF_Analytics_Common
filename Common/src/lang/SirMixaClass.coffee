_ = require("lodash")

toSet = require("Common/src/util/DataUtil.js").toSet

module.exports = SirMixaClass =
	###
	Util for mixins in classes. Special lifecycle methods are also supported, as opposed to normal mixin methods
	which either get clobbered or cause an error to be thrown, lifecycle events can be stacked and called sequentially
	in the order the mixins are defined. Mixins can contain properties and methods, except in lifecycle methods.

	@author zuye.zheng
	###

	mix: (Clazz, mixins, {
		# Whether clobbering of mixin methods that are not lifecycles is allowed, if not, exceptions will be thrown.
		allowClobbering
		# Methods that are expected to be in multiple mixins and should be called sequentially vs clobbered. Should be
		# an array. If no mixin has a the specific lifecycle method defined, a noop will be inserted.
		lifecycleMethods
	} = {}) ->
		allowClobbering ?= false
		lifecycleMethods ?= []

		lifecycleMethodsSet = toSet(lifecycleMethods, true)

		# stacked lifecycle events
		collectedLifecycle = {}

		# go through all the mixins and collect the lifeycle events and push the normal ones to the prototype
		for curMixin in mixins
			for curPropName, curProp of curMixin
				if lifecycleMethodsSet[curPropName] == true
					# lifecycle event
					if !_.isFunction(curProp)
						throw new Error("Lifecycle '#{curPropName}' must be a function.")
					collectedLifecycle[curPropName] ?= []
					collectedLifecycle[curPropName].push(curProp)
				else
					if Clazz::[curPropName]? && !allowClobbering
						throw new Error("Collision in lifecycle method '#{curPropName}'.")

					Clazz::[curPropName] = curProp

		# add the lifecycle events
		for curLifecycle in lifecycleMethods
			curLifecycleMethods = collectedLifecycle[curLifecycle]

			# see if the class implemented it
			if Clazz::[curLifecycle]?
				curLifecycleMethods.push(Clazz::[curLifecycle])

			if curLifecycleMethods?
				# add or swap the lifecycle method to execute sequentially
				Clazz::[curLifecycle] = do (curLifecycleMethods) -> ->
					for curMethod in curLifecycleMethods
						# return the last value
						lastReturn = curMethod.apply(@, arguments)

					lastReturn
			else
				# noop it
				Clazz::[curLifecycle] = ->

		undefined
