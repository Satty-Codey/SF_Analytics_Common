_ = require("lodash")
toNumber = require("Common/src/util/NumberUtil.js").toNumber
trim = require("Common/src/util/StringUtil.js").trim

QUOTE = '"'
DECIMAL = '.'
EMPTY_STRING = ''
BUDDHIST_YEAR_OFFSET = 543

module.exports = class AuraLocalizationService
	###
	Localization service. Uses Aura APIs.

	@DEPRECATED: Use Localizer.
	###

	constructor: (@_$A = window.$A, initLocalizationService) ->
		if initLocalizationService
			# We only need to init it in standalone mode
			@_$A.localizationService.init()
		# Accepts an Aura param to allow unit tests to mock locale changes

	_getLocalizationService: ->
		@_$A.localizationService

	getLocale: ->
		@_$A.get('$Locale')

	getDateFormat: ->
		@_$A.get('$Locale.dateFormat')

	getShortDateFormat: ->
		@_$A.get('$Locale.shortDateFormat')

	getDateTimeFormat: ->
		@_$A.get('$Locale.datetimeFormat')

	getTimeFormat: (replaceSeconds=false) ->
		timeFormat = @_$A.get('$Locale.timeFormat')
		if replaceSeconds then timeFormat.replace(':ss', '') else timeFormat

	getGrouping: ->
		@_$A.get('$Locale.grouping')

	getDecimal: ->
		@_$A.get('$Locale.decimal')

	getPercent: ->
		@getDefaultPercentFormat()?.$suffix$ || "%"

	getCurrency: ->
		@_$A.get('$Locale.currency')

	getCurrencyCode: ->
		@_$A.get('$Locale.currencyCode')

	getNormalizedFormat: (format) ->
		@_getLocalizationService().getNormalizedFormat(format)

	getDefaultPercentFormat: ->
		@_getLocalizationService().getDefaultPercentFormat()

	parseDateTime: (date, dateFormat, locale, strictParsing) ->
		@_getLocalizationService().parseDateTime(date, dateFormat, locale, strictParsing)

	formatDate: (date, dateFormat, locale) ->
		@_getLocalizationService().formatDate(date, dateFormat, locale)

	formatDateTime: (datetime, dateFormat, locale) ->
		@_getLocalizationService().formatDateTime(datetime, dateFormat, locale)

	formatTime: (time, dateFormat, locale) ->
		@_getLocalizationService().formatTime(time, dateFormat, locale)

	_getNumberFormat: (number) ->
		# Return the NumberFormat to express the full precision of 'number'. This is needed because
		# LocalizationService's default NumberFormat truncates to 3 decimal places
		numberFormat = @_getLocalizationService().getDefaultNumberFormat()
		if _.floor(number) isnt toNumber(number)
			numDecimalPlaces = number.toString().split(DECIMAL)[1].length || 0
			# Note that this string doesn't appear to be localized properly (W-4693428)
			formatString = "#,###." + _.repeat('#', numDecimalPlaces)
			numberFormat = @_getLocalizationService().getNumberFormat(formatString)
		numberFormat

	parseNumber: (number) ->
		# Given localized number string 'number', parse and return a number primitive
		return if not number? or number is ""
		if _.isString(number)
			# Return null if 'number' has a grouping in the decimal part of the number
			decimalIndex = _.indexOf(number, @getDecimal())
			return if decimalIndex > -1 and _.lastIndexOf(number, @getGrouping()) > decimalIndex
			# Normalize number string by stripping special characters and replacing localized
			# decimal character with '.'
			groupingRegex = new RegExp('\\' + @getGrouping(), 'g')
			number = number
				.replace(/\"/g, EMPTY_STRING)
				.replace(groupingRegex, EMPTY_STRING)
				.replace(@getDecimal(), DECIMAL)
				.replace(@getPercent(), EMPTY_STRING)
				.replace(@getCurrency(), EMPTY_STRING)
				.replace(@getCurrencyCode(), EMPTY_STRING)
			number = toNumber(trim(number))
		number if not _.isNaN(number)

	formatNumber: (number) ->
		# Given number or string 'number', format into localized number string
		parsedNumber = @parseNumber(number)
		if parsedNumber?
			@_getNumberFormat(parsedNumber).format(parsedNumber)
		else
			number?.toString() || ""

	formatPercent: (percent) ->
		# Given number or string 'percent', format into localized percent string
		parsedPercent = @parseNumber(percent)
		if parsedPercent?
			@_getLocalizationService().formatPercent(parsedPercent/100)
		else
			percent?.toString() || ""

	formatCurrency: (amount) ->
		# Given number or string 'amount', format into localized currency string
		parsedAmount = @parseNumber(amount)
		if parsedAmount?
			@_getLocalizationService().formatCurrency(parsedAmount)
		else
			amount?.toString() || ""

	displayDateTime: (date, formatString, locale) ->
		@_getLocalizationService().displayDateTime(date, formatString, locale)

	UTCToWallTime: (date, timezone, callback) ->
		@_getLocalizationService().UTCToWallTime(date, timezone, callback)

	WallTimeToUTC: (date, timezone, callback) ->
		@_getLocalizationService().WallTimeToUTC(date, timezone, callback)

	parseDateTimeUTC: (dateTimeString, parseFormat, locale, strictParsing) ->
		@_getLocalizationService().parseDateTimeUTC(dateTimeString, parseFormat, locale, strictParsing)

	formatDateTimeUTC: (date, formatString, locale) ->
		@_getLocalizationService().formatDateTimeUTC(date, formatString, locale)

	formatDateUTC: (date, formatString, locale) ->
		@_getLocalizationService().formatDateUTC(date, formatString, locale)

	translateToOtherCalendar: (date) ->
		@_getLocalizationService().translateToOtherCalendar(date)

	translateFromOtherCalendar: (date) ->
		@_getLocalizationService().translateFromOtherCalendar(date)

	parseDateTimeISO8601: (dateString) ->
		@_getLocalizationService().parseDateTimeISO8601(dateString)

	translateToLocalizedDigits: (input) ->
		@_getLocalizationService().translateToLocalizedDigits(input)

	translateFromLocalizedDigits: (input) ->
		@_getLocalizationService().translateFromLocalizedDigits(input)

	getCalendarYearOffset: ->
		if @_isBuddhistCalendar() then BUDDHIST_YEAR_OFFSET else 0

	isBefore: (date1, date2, unit) ->
		@_getLocalizationService().isBefore(date1, date2, unit)

	isAfter: (date1, date2, unit) ->
		@_getLocalizationService().isAfter(date1, date2, unit)

	isSame: (date1, date2, unit) ->
		@_getLocalizationService().isSame(date1, date2, unit)

	isBetween: (date, fromDate, toDate, unit) ->
		@_getLocalizationService().isBetween(date, fromDate, toDate, unit)

	isValidDateObject: (date) ->
		(date instanceof Date) && !isNaN(date.getTime())

	_isBuddhistCalendar: ->
		userLocaleLang = @_$A.get("$Locale.userLocaleLang")
		userLocaleCountry = @_$A.get("$Locale.userLocaleCountry")
		userLocaleLang == 'th' && userLocaleCountry == 'TH'

	getNumberFormatter: (number) ->
		# Builds a number formatter based on the specified sample
		# e.g.
		#   "USD 123.45" -> "USD #,###.00"
		#   1234.5 -> "#,###.0"
		if _.isNumber(number)
			number = number.toString()

		format = ''
		afterDecimal = false
		groupingSeparator = @_$A.get('$Locale.grouping') || ','
		decimalSeparator = @_$A.get('$Locale.decimal') || '.'

		for c in number
			if c >= '0' && c <= '9'
				format += if afterDecimal then '0' else '#'
			else if c == groupingSeparator
				format += ','
			else if c == decimalSeparator
				format += '.'
				afterDecimal = true
			else if c != '-'
				format += c

		format = format.replace('#.', '0.')
		if format.charAt(format.length-1) == '#'
			format = format.substring(0, format.length-1) + '0'

		try
			@_getLocalizationService().getNumberFormat(format)
		catch
			@_getLocalizationService().getDefaultNumberFormat()
