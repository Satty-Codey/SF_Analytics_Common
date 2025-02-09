module.exports = JSONUtils  =
    ###
    Utils to deal with json

    @author ppominville
    ###

    parseJSON: (json) ->
        ###
        Parse json that might also just be a plain string.
        @return the parsed json if it's valid json, or just the string if parsing fails
        eg: "[\"US\"],[\"EU\"]" -> ["US", "EU"], "US" -> ["US"], etc ..
        ###
        if json
            try
                return JSON.parse(json)
            catch
                # handle the case where the value is just a plain string
                return json
        null

