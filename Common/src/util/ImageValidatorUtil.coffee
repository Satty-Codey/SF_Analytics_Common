AppConfig = require("Common/src/core/AppConfig.coffee")
ServiceInjector = require("Common/src/core/di/ServiceInjector.js").default
UrlValidator = require("Common/src/url/UrlValidator.js").default

VALID_ORIGINS_FOR_IMAGES = ["https://*.salesforce.com", "https://*.force.com", "https://*.visualforce.com", "https://*.documentforce.com"]

module.exports = ImageValidatorUtil =
	###
	Util for image url validation

	@author pmaliwat
	###

	getImageValidatorRemote: ->
		validOrigins = @getValidOrigins()

		(url, allowRelativeUrl) ->
			url if (allowRelativeUrl && url.startsWith('/')) || new UrlValidator().validateUrl(url, validOrigins)

	getValidOrigins: ->
		configOrigins = ServiceInjector.get(AppConfig).getValidImageUrlDomains()
		if !configOrigins || configOrigins.length == 0
			configOrigins = VALID_ORIGINS_FOR_IMAGES

		[configOrigins..., window.location.origin]

	getImageValidatorLocal: ->
		(url) -> "chart_icons/#{url}" if url

	getImageValidatorCommunity: ->
		###
		in community, path can be either assets's relative path or valid origins.
		Validate the path contains site prefix
		###
		validOrigins = @getValidOrigins()
		prefix = ServiceInjector.get(AppConfig).getSitePrefix()

		(url) ->
			url if url.startsWith(prefix) || new UrlValidator().validateUrl(url, validOrigins)

	getImageValidator: ->
		if ServiceInjector.get(AppConfig).isInCommunityContext()
			@getImageValidatorCommunity()
		else if ServiceInjector.get(AppConfig).isCmsMode()
			@getImageValidatorRemote()
		else
			@getImageValidatorLocal()
