// @flow

/**
 * Compare two case-sensitive strings.
 */
export function compareStrings(
	str1: string,
	str2: string,
	str1Normalized: string = str1.toLowerCase(),
	str2Normalized: string = str2.toLowerCase()
): number {
	if (str1 === str2) {
		return 0;
	}

	if (str1Normalized === str2Normalized) {
		for (let i = 0; i < str1.length; i++) {
			const char1 = str1.charAt(i);
			const char2 = str2.charAt(i);

			if (char1 !== char2) {
				// Upper case will come after lower case in ascending order
				if (char1 === char1.toUpperCase()) {
					return 1;
				} else {
					return -1;
				}
			}
		}

		return 0;
	} else {
		// if two string are unequal when case insensitively, let JS libray to handle that
		if (str1Normalized > str2Normalized) {
			return 1;
		} else {
			return -1;
		}
	}
}

/**
 * Sort list of strings.
 */
export function sortStringList(list: Array<string>): Array<string> {
	return list.sort((e1, e2) => {
		return compareStrings(e1, e2);
	});
}

/**
 * Sort list according to the specific string attribute or index in each element.
 */
export function sortList(list: Array<Array<string>>, dataIndex: number, normalizedIndex: number): Array<Array<string>> {
	return list.sort((e1, e2) => {
		if (normalizedIndex != null) {
			return compareStrings(e1[dataIndex], e2[dataIndex], e1[normalizedIndex], e2[normalizedIndex]);
		} else {
			return compareStrings(e1[dataIndex], e2[dataIndex]);
		}
	});
}
