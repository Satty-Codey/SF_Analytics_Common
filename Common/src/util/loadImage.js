// @flow

/**
 * Loads an image from a given URL
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.src = url;
		image.addEventListener('load', () => resolve(image));
		// $FlowFixMe[incompatible-call] Added when enabling local type inference.
		image.addEventListener('error', (error) => resolve(error));
	});
}
