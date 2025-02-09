_ = require("lodash")

Mediator = require("Common/src/core/Mediator.coffee")

module.exports = class AuraService
	###
	Aura Event Service to mainly communicate with the core aura app

	@author jinming.you
	###

	constructor: (@_parentOrigin, @_parentAuraApp, @_appContext) ->
		@_beforeUnloadHandlers = {}
		@_messageHandlers = {}

	getAppContext: ->
		# Return the app context
		@_appContext

	isInAuraContext: ->
		# Return true if we are in core in Aura, false if in standalone development mode
		@_parentAuraApp?

	shouldUseNewRunPage: ->
		$A.get('$Browser.S1Features.isReportEnhancedRunPageEnabled')

	shouldEnableCopyToClipboardAction: ->
		$A.get('$Browser.S1Features.isReportEnhancedRunPageCopyToClipboardActionEnabled')

	navigateToComponent: (componentName, attributes) ->
		@_postMessageToParent('force:navigateToComponent', {"componentDef": componentName, "componentAttributes": attributes})

	navigateToSObject: (recordId) ->
		@_postMessageToParent('force:navigateToSObject', {recordId})

	navigateToReportRun: (reportId, describeMetadata, isView) ->
		@_postMessageToParent('reports:runReportEvent', {"iframeName": window.name, reportId, "reportDescribe": describeMetadata, isView})

	navigateToObjectHome: (scope="Report") ->
		@_postMessageToParent('force:navigateToObjectHome', {scope})

	updateRecordId: (reportId) ->
		@postReportBuilderAppMessage({"updateRecordId": true, reportId})
		Mediator.trigger("reports:updateReportId", reportId)

	clickToDial: (number) ->
		@_postMessageToParent('opencti:clickToDial', {number})

	navigateToReport: (reportId, filters) ->
		if not _.isEmpty(filters)
			filterJson = JSON.stringify(filters)
			viewUrl = "#/sObject/" + encodeURIComponent(reportId) + "/view?reportFilters=" + encodeURIComponent(filterJson)
			@_postMessageToParent('force:navigateToURL', {"url" : viewUrl})
		else
			@navigateToSObject(reportId)

	navigateBack: (useHandler) ->
		@postReportBuilderAppMessage({navigateBack: {useHandler}})

	navigateToRecord: (recordId, isCtrlKey) ->
		@postReportBuilderAppMessage({navigateToRecord: {recordId, isCtrlKey}})

	showRecordPreview: (recordId, reportId, recordName) ->
		@postReportBuilderAppMessage({showRecordPreview: {recordId, reportId, recordName, showRecordPreview: true}})

	showToastMessageWithAttributes: (attributes) ->
		@_postMessageToParent('force:showToast', attributes)

	showToastMessage: (message, type = "info", key="info", isClosable, isSticky, dummyFunction) ->
		@showToastMessageWithAttributes({message, type, key, isClosable, isSticky})

	maskHeader: (isMasked) ->
		@_postMessageToParent('one:maskHeader', {"masked": isMasked})
		@postReportBuilderAppMessage(
			maskHeader: true
			isMasked: isMasked
		)

	_postMessageToParent: (eventName, attributes) ->
		eventData = {
			event: eventName
			arguments: attributes
		}
		window.parent.postMessage(JSON.stringify(eventData), @_getOrigin())

	postReportBuilderAppMessage: (message) ->
		message.iframeName = window.name
		message.srcApp = "reportBuilderApp"
		window.parent.postMessage(JSON.stringify(message), @_getOrigin())

	showSpinner: (hideLoadingDot) ->
		@postReportBuilderAppMessage({showSpinner: true, hideLoadingDot})

	hideSpinner: ->
		@postReportBuilderAppMessage({hideSpinner: true})

	setWindowTitle: (windowTitle) ->
		@postReportBuilderAppMessage({windowTitle})

	_getOrigin: ->
		@_parentOrigin || window.location.origin

	queryDataProvider: (queryString, scope='Report', entity='Folder', queryScope=undefined, reportId=null) ->
		@_postMessageToParent("reports:queryDataProviderEvent", {
			reportId
			queryString
			scope
			entity
			queryScope
		})

	beforeUnload: (callback, key) ->
		@_beforeUnloadHandlers[key] = callback if key
		window.addEventListener('beforeunload', callback)

	removeBeforeUnload: (callback, key) ->
		if key
			callback = @_beforeUnloadHandlers[key]
		window.removeEventListener('beforeunload', callback)

	registerBeforeFunctions: ->
		@postReportBuilderAppMessage({ registerBeforeFunctions: true })

	unregisterBeforeFunctions: ->
		@postReportBuilderAppMessage({ unregisterBeforeFunctions: true })

	clearStoredDescribe: (reportId) ->
		return if not reportId
		@clearCachedAuraActionResult('getInitialReportMetadata', { reportId })
		@clearCachedAuraActionResult('describeReport', { reportId })

	clearCachedAuraActionResult: (actionName, params) ->
		actionDescriptor = "serviceComponent://ui.analytics.reporting.runpage.ReportPageController/ACTION$#{actionName}"
		window.parent.$A.clientService.invalidateAction(actionDescriptor, params)

	setCallback: (callback, key) ->
		@_messageHandlers[key] = callback if key
		window.addEventListener("message", callback, false)

	removeCallback: (callback, key) ->
		callback = @_messageHandlers[key] if key
		window.removeEventListener("message", callback, false)
