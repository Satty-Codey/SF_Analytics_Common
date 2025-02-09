moment = require("moment-timezone")

LC = require("Common/src/localization/LC.js").default
ServiceInjector = require("Common/src/core/di/ServiceInjector.js").default
AppConfig = require("Common/src/core/AppConfig.coffee")

module.exports = LocalizedDateUtil =

	_sfdcToMomentLocales: {}

	# Formats timestamp in chatteresque relative date. E.g. Today at 1:23 PM
	# if the date is at the same day.
	#Input
	#	dateInput - date representation in number, string, or object used to get time
	#	appUser - object encapsulating user settings from core
	formatUserLocalizedTimeStamp: (dateInput, appUser) ->
		# get the current time
		baseDate = moment.utc()
		date = @getLocalizedMoment(dateInput, appUser)

		# determine whether a chattereque relative date is needed
		if date.isSame(baseDate, 'day')
			dateStamp = LC.getLabel('DateFormat', 'today')
		else if date.isSame(baseDate.subtract(1, 'day'), 'day')
			dateStamp = LC.getLabel('DateFormat', 'yesterday')
		else if date.isSame(baseDate.subtract(1, 'day'), 'day')
			dateStamp = LC.getLabel('DateFormat', 'twoDaysAgo')
		else
			dateStamp = date.format('ll')

		# format final output
		timeOfDay = date.format('LT')
		LC.getLabel('DateFormat', 'dayTime', dateStamp, timeOfDay)

	#Creates a time stamp string given a non-zero UTC in seconds.
	#This will use the logged in user's core locale setting to format the time stamp string
	#	dateInput - the number of milliseconds in UTC used to convert to output time stamp
	formatTimestamp: (dateInput) ->
		timeStamp = ''
		if dateInput
			timeStamp = @formatUserLocalizedTimeStamp(dateInput, ServiceInjector.get(AppConfig).getAppUser())

	formatTimeOfDay: (dateInput) ->
		### Returns a string in the format of H:MM (AM/PM) ###
		date = @getLocalizedMoment(dateInput)
		date.format("LT")

	formatMoment: (dateInput, formatType) ->
		### Locale aware date and time formats are available using LT LTS L LL LLL LLLL ###
		date = @getLocalizedMoment(dateInput)
		date.format(formatType)

	formatDateAndTime: (dateInput, formatType, ignoreZeroTimestamp = false) ->
		### Returns Locale aware date and time formats available using LT LTS L LL LLL LLLL, along with time of day ###
		if ignoreZeroTimestamp && dateInput == 0
			null
		else
			@getLocalizedMoment(dateInput).format(formatType) + ', ' + @formatTimeOfDay(dateInput)

	getLocalizedMoment: (dateInput, appUser = ServiceInjector.get(AppConfig).getAppUser()) ->
		### returns a moment.js date with the user's locale and timezone info ###
		date = moment(dateInput)
		@_applyUserTimeZone(date, appUser)

	getLocalizedMomentInUTC: (dateInput) ->
		# remove this when query engine supports timezone and use one above method
		date = moment.utc(dateInput)
		@_applyUserLocale(date)

	getLocalizedMomentFromString: (dateString, format, isStrict=false) ->
		### return moment from formatted string. (i.e. "01/01/2016", "MM/DD/YYYY") ###
		locale = ServiceInjector.get(AppConfig).getAppUser().getLocale()

		### Fall back to en_US locale when we can't find the locale data based on the Core string ###
		localeData = moment.localeData(locale)
		if localeData is null
			locale = 'en_US'
			localeData = moment.localeData(locale)

		date = moment(dateString, localeData.longDateFormat(format), locale, isStrict)
		@_applyUserLocale(date)

	getLocalizedMomentFromStringInUTC: (dateString, format, isStrict=false) ->
		### return moment from formatted string. (i.e. "01/01/2016", "MM/DD/YYYY") ###
		locale = ServiceInjector.get(AppConfig).getAppUser().getLocale()

		### Fall back to en_US locale when we can't find the locale data based on the Core string ###
		localeData = moment.localeData(locale)
		if localeData is null
			locale = 'en_US'
			localeData = moment.localeData(locale)

		date = moment.utc(dateString, localeData.longDateFormat(format), locale, isStrict)
		@_applyUserLocale(date)

	getUtcMilliesFromDate: (date) ->
		### convert a Date object to utc millies ###
		date.getTime()

	getUnixMillisecondsFromEpochSeconds: (epochSeconds) ->
		### convert Epoch Seconds into unix milliseconds ###
		moment.unix(epochSeconds)

	isValidMoment: (dateString) ->
		### check if input string is a valid moment ###
		moment(dateString).isValid()

	parseISO8601: (str) ->
		### Parses and converts ISO8601 formatted date + time string and returns as utc in millis ###
		new Date(str).getTime()

	getMomentForQueryResponse: (cellValue) ->
		###get corresponding Date object in GMT ###
		cells = cellValue.split(" ");
		if cells.length == 1
			cells = cellValue.split("T");
		cellValue = ''
		for cell in cells
			cellValue += cell + ' '
		moment.utc(cellValue)

	getStartOfDay: (date) ->
		absoluteMoment = moment(date)
		@_getStartOrEndOfDayMillis(absoluteMoment, true)

	getEndOfDay: (date) ->
		absoluteMoment = moment(date)
		@_getStartOrEndOfDayMillis(absoluteMoment, false)

	_getStartOrEndOfDayMillis: (absoluteMoment, isStartOfGrain) ->
		if isStartOfGrain then absoluteMoment.startOf('day').valueOf() else absoluteMoment.endOf('day').valueOf()

	getOffsetOfDateBySecondsMillis: (date, offset) ->
		absoluteMoment = moment(date)
		absoluteMoment.add(offset, 'second').valueOf()

	getStartOfByGrainAndOffset: (grain, offset) ->
		###
		Gets the start moment of a unit of time (grain) and the provided offset and returns millis

		grain types:
		'year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'date', 'hour', 'minute', 'second'

		offset: number that can be positive, negative or 0 that is added to the current moment's grain
		###
		@_getStartOrEndMillisByGrainAndOffset(grain, offset, true)

	getEndOfByGrainAndOffset: (grain, offset) ->
		###
		Gets the end moment of a unit of time (grain) and the provided offset and returns millis

		grain types:
		'year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'date', 'hour', 'minute', 'second'

		offset: number that can be positive, negative or 0 that is added to the current moment's grain
		###
		@_getStartOrEndMillisByGrainAndOffset(grain, offset, false)

	_getStartOrEndMillisByGrainAndOffset: (grain, offset, isStartOfGrain) ->
		###
		Gets the proper moment by adding the provided offset and then setting it to the
		start or end of a unit of time (grain) and returns millis

		grain types:
		'year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'date', 'hour', 'minute', 'second'

		offset: number that can be positive, negative or 0 that is added to the current moment's grain
		###
		relativeMoment = moment()
		if offset!= 0
			relativeMoment.add(offset, grain)
		if isStartOfGrain then relativeMoment.startOf(grain).valueOf() else relativeMoment.endOf(grain).valueOf()

	_applyUserTimeZone: (date, appUser=ServiceInjector.get(AppConfig).getAppUser()) ->
		# convert into user timezone
		date.tz(appUser.getTimezone())
		@_applyUserLocale(date, appUser)

	_applyUserLocale: (date, appUser=ServiceInjector.get(AppConfig).getAppUser()) ->
		###
		convert into user's locale
		Moment.js locale keys are internally different from sfdc locale keys.
		Usually no real problem since moment js will translate keys for us internally
		however, before doing so it attempts to load a locale config first via require
		this is a signifcant performance hit since it attempts to do this every single
		time we call moment.locale - which we do a lot!
		To help moment.js without having to modify it, we can simply remember the
		translated locale key for the next time around.
		###
		idealLocale = appUser.getLocale()
		if @_sfdcToMomentLocales[idealLocale]
			date.locale(@_sfdcToMomentLocales[idealLocale])
		else
			date.locale(idealLocale)
			@_sfdcToMomentLocales[idealLocale] = date.locale()

		date
