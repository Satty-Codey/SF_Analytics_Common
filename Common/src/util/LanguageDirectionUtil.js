//@flow

/**
 * Utility class for detecting the document language direction.
 * Once the direction is determined, it's cached.
 *
 * @author iminevskiy
 * @since 222
 */
export default class LanguageDirectionUtil {
	static LTR: string = 'ltr';
	static RTL: string = 'rtl';
	static direction: string;

	static getDirection(): string {
		if (!LanguageDirectionUtil.direction) {
			const element = document.querySelector('html');
			if (element) {
				LanguageDirectionUtil.direction = element.dir;
			}
		}
		return LanguageDirectionUtil.direction &&
			LanguageDirectionUtil.direction.toLowerCase() === LanguageDirectionUtil.RTL
			? LanguageDirectionUtil.RTL
			: LanguageDirectionUtil.LTR;
	}

	static isRTL(): boolean {
		return LanguageDirectionUtil.getDirection() === LanguageDirectionUtil.RTL;
	}
}
