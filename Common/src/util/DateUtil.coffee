_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
_DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat']

FEBRUARY = 2
APRIL = 4
JUNE = 6
SEPTEMBER = 9
NOVEMBER = 11

module.exports = DateUtil =
	###
	Utils for detect date format.
	Most of the code is orinially from SfdcCore.js

	Check https://developer.salesforce.com/docs/atlas.en-us.bi_dev_guide_ext_data.meta/bi_dev_guide_ext_data/bi_ext_data_schema_reference.htm
	for suported date format
	###

	isDate: (val,format) ->
		date = @getDateFromFormat(val,format)
		if (date == 0)
			return false
		return true

	getDateFromFormat: (val, format, isUTC = false) ->
		val = "" if !val?
		format = format + ""
		iVal = 0
		i_format = 0
		now = new Date()
		year = now.getFullYear()
		month = now.getMonth()+1
		date = 1
		hh = 0
		mm = 0
		ss = 0
		milliseconds = 0
		ampm = ""

		while (i_format < format.length)
			# Get next token from format string
			c = format.charAt(i_format)
			token = ""
			while ((format.charAt(i_format)==c) && (i_format < format.length))
				token += format.charAt(i_format++)

			# Extract contents of value based on format token
			if (token == "yyyy" || token == "yy" || token == "y")
				if (token == "yyyy")
					# x=2,y=4 to be consistent with java.
					x = 4
					y = 4
				if (token == "yy")
					x = 2
					y = 2
				if (token == "y")
					x = 2
					y = 4
				year = @_getInt(val,iVal,x,y)
				if (year == null)
					return 0
				iVal += year.length
				if (year.length == 2)
					if (year > 70)
						year = 1900+(year-0)
					else
						year = 2000+(year-0)

			else if (token=="MMM"||token=="NNN")
				month = 0;
				for i in [0 .. _MONTH_NAMES.length-1]
					month_name = _MONTH_NAMES[i]
					if val.substring(iVal,iVal+month_name.length).toLowerCase() == month_name.toLowerCase()
						if (token == "MMM" || (token == "NNN" && i>11))
							month = i+1
							if (month>12)
								month -= 12
							iVal += month_name.length
							break
				if ((month < 1) || (month > 12))
					return 0

			else if (token=="EE"||token=="E")
				for i in [0 .. @_DAY_NAMES.length-1]
					day_name = @_DAY_NAMES[i]
					if (val.substring(iVal,iVal+day_name.length).toLowerCase() == day_name.toLowerCase())
						iVal += day_name.length
						break
			else if (token=="MM"||token=="M")
				month = @_getInt(val,iVal,token.length,2)
				if (month==null||(month<1)||(month>12))
					return 0
				iVal+=month.length
			else if (token=="dd"||token=="d")
				date = @_getInt(val,iVal,token.length,2)
				if (date==null||(date<1)||(date>31))
					return 0
				iVal+=date.length
			else if (token=="hh"||token=="h")
				hh = @_getInt(val,iVal,token.length,2)
				if (hh==null||(hh<1)||(hh>12))
					return 0
				iVal+=hh.length
			else if (token=="HH"||token=="H")
				hh = @_getInt(val,iVal,token.length,2)
				if (hh==null||(hh<0)||(hh>23))
					return 0
				iVal+=hh.length
			else if (token=="KK"||token=="K")
				hh = @_getInt(val,iVal,token.length,2)
				if (hh==null||(hh<0)||(hh>11))
					return 0
				iVal+=hh.length
			else if (token=="kk"||token=="k")
				hh = @_getInt(val,iVal,token.length,2)
				if (hh==null||(hh<1)||(hh>24))
					return 0
				iVal+=hh.length
				hh--
			else if (token=="mm"||token=="m")
				mm = @_getInt(val,iVal,token.length,2)
				if(mm==null||(mm<0)||(mm>59))
					return 0
				iVal += mm.length
			else if (token=="ss"||token=="s")
				ss = @_getInt(val,iVal,token.length,2)
				if(ss==null||(ss<0)||(ss>59))
					return 0
				iVal+=ss.length
			else if (token=="SSS")
				milliseconds = @_getInt(val,iVal,token.length,3)
				if(milliseconds==null||(mm<0)||(mm>999))
					return 0
				iVal+=milliseconds.length

			else if (token=="a")
				am = "AM"
				pm = "PM"
				stra = val.substring(iVal, iVal + am.length)
				strp = val.substring(iVal, iVal + pm.length)
				if (stra == am || stra.toUpperCase() == am)
					ampm = am
				else if (strp == pm || strp.toUpperCase() == pm)
					ampm = pm
				else
					return 0
				iVal += ampm.length
			else
				if (val.substring(iVal,iVal+token.length)!=token)
					return 0
				else
					iVal += token.length
		# If there are any trailing characters left in the value, it doesn't match
		if (iVal != val.length)
			return 0

		# Is date valid for month?
		###
			NOTE: convert to number because 'month' itself is a string that may possibly be padded (i.e. 02) so absolute equality '==' checks will fail
				due to the typing.
		###
		numMonth = Number(month)
		if (numMonth==FEBRUARY)
			# Check for leap year
			if ( ( (year%4 == 0)&&(year%100 != 0) ) || (year%400 == 0) ) #leap year
				if (date > 29)
					return 0
			else
				if (date > 28)
					return 0
		if ((numMonth==APRIL)||(numMonth==JUNE)||(numMonth==SEPTEMBER)||(numMonth==NOVEMBER))
			if (date > 30)
				return 0
		# Correct hours value
		if (hh<12 && ampm == "PM")
			hh = hh-0+12
		else if (hh>11 && ampm == "AM")
			hh -= 12
		newdate = if isUTC then new Date(Date.UTC(year,month-1,date,hh,mm,ss)) else new Date(year,month-1,date,hh,mm,ss)
		return newdate.getTime()


	_getInt: (str, i, minlength, maxlength) ->
		for x in [maxlength .. minlength]
			token = str.substring(i,i+x)
			if token.length < minlength
				return null
			if @_isInteger(token)
				return token
		return null

	_isInteger: (val) ->
		digits = "1234567890"
		for i in [0 .. val.length-1]
			if digits.indexOf(val.charAt(i)) == -1
				return false
		return true

	getDate: (grain) ->
		###
		This is a simple mapping that returns the function for each grain for converting relative dates to absolute ones.
		It is also used for validation of query strings (e.g. if user passes "yeaaars", we can check its existence in this map)
		e.g. year(3, true) gives you the date three years from now as an end cap of the range
		###
		switch grain
			when 'year', 'years' then return DateUtil.yearRelative
			when 'fiscal_year', 'fiscal_years' then return DateUtil.fiscalYearRelative
			when 'quarter', 'quarters' then return DateUtil.quarterRelative
			when 'fiscal_quarter', 'fiscal_quarters' then return DateUtil.fiscalQuarterRelative
			when 'month', 'months' then return DateUtil.monthRelative
			when 'week', 'weeks' then return DateUtil.weekRelative
			when 'day', 'days' then return DateUtil.dayRelative

	yearRelative: (now, offset, isStart) ->
		DateUtil.fiscalYearRelative now, offset, isStart, 0

	quarterRelative: (now, offset, isStart) ->
		DateUtil.fiscalQuarterRelative now, offset, isStart, 0

	fiscalYearRelative: (now, offset, isStart, fiscalOffset) ->
		{year, month} = DateUtil.datePieces now

		year += offset
		# deal with numbers negative numbers and < -12 and > 12
		fyStartMonth = ((fiscalOffset % 12) + 12) % 12
		if fyStartMonth > month
			year -= 1

		if not isStart
			year += 1
			day = 0
		else
			day = 1

		new Date year, fyStartMonth, day

	fiscalQuarterRelative: (now, offset, isStart, fiscalOffset) ->
		{year, month} = DateUtil.datePieces now

		delta = (month - fiscalOffset) % 3
		if delta < 0
			delta += 3

		if not isStart # adjust month to be end of the quarter
			month += 3
			day = 0
		else
			day = 1

		new Date year, month - delta + (offset * 3), day

	monthRelative: (now, offset, isStart) ->
		{year, month} = DateUtil.datePieces now
		date = new Date(year, month + offset, 1)
		if not isStart
			date = DateUtil.endMonthDate date
		date

	weekRelative: (now, offset, isStart) ->
		{year, month} = DateUtil.datePieces now
		day = now.getDate() - now.getDay() # start date of the week
		if not isStart then day += 6 # to get end date of week
		new Date(year, month, day + offset * 7)

	dayRelative: (now, offset, isStart) ->
		{year, month, day} = DateUtil.datePieces now
		new Date year, month, day + offset

	datePieces: (date) ->
		### just unpacks a date into y/m/d vars ###

		year: date.getFullYear(), month: date.getMonth(), day: date.getDate()

	endMonthDate: (date) ->
		### returns a date set to last day of month for given month & year ###
		{year, month} = DateUtil.datePieces date
		new Date(year, month + 1, 0)


	# pigql verbs, like "4 years ago"
	past_verb: "ago"
	future_verb: "ahead"
	current_verb: "current"

	tense_verb_offsets:
		"ago": -1
		"current": false
		"ahead": 1

	relativeDateArrayToStr: (dateArr) ->
		###
		This is used by the Client to format pigql queries given a relative date filter
		["year", 4] --> "\"4 years ahead\""
		###
		[grain, offset] = dateArr
		if offset > 0 # we know offset is an int because we validated
			verb = DateUtil.future_verb
		else if offset < 0
			verb = DateUtil.past_verb
			offset = Math.abs offset
		else
			offset = "current"

		if (offset > 1) or (offset < -1)
			grain += "s" # '1 year ago' vs '2 years ago'

		expression = "#{offset} #{grain}"
		if verb then expression += " #{verb}"
		"\"#{expression}\"" # "2 years ago"
