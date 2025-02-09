$ = require("jquery")

module.exports = DownloadMixin =
	###
	This mixin is used on items that need to handle different browser download action.
	Any component using this mixin needs to pass an anchor tag as target.
	###

	handleDownloadFunction: (fileName, downloadContent, target)->
		a = document.createElement('a')
		blobObject = new Blob([downloadContent])
		if window.navigator.msSaveBlob
			###
			if the browser is IE
			###
			window.navigator.msSaveBlob(blobObject, fileName)
		else if Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0
			###
			if the browser is safari, we open a new tab showing the downloadContent.
			###
			newTab = window.open 'about:blank'
			newTab.document.write(downloadContent)
		else if typeof a.download != "undefined"
			###
			For all other browsers which support HTML5 download attribute
			###
			csvUrl = URL.createObjectURL(blobObject)
			$(target).attr("href", csvUrl)
			$(target).attr("download", fileName)

