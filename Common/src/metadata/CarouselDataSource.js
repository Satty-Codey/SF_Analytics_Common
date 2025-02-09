// @flow
/**
 * Shared interface for carousel data
 *
 * @author etsao
 * @since 220
 */
export interface CarouselDataSource<T> {
	getResults(offset: number, limit: number): Promise<Array<T>>;

	getTotalCount(): number;
}
