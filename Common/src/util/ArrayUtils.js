// @flow

/**
 * Contains efficient algorithms for array operations
 *
 * @author abaghani
 * @since 230
 */
export default class ArrayUtils<T> {
	/**
	 * Moves an element from fromIndex to toIndex with complexity time=O(n) space=O(1)
	 * @param array
	 * @param fromIndex
	 * @param toIndex
	 */
	static move(array: Array<T>, fromIndex: number, toIndex: number): void {
		let startIndex = fromIndex;
		const endIndex = toIndex;
		const startValue = array[startIndex];
		if (startIndex < endIndex) {
			while (startIndex < endIndex) {
				array[startIndex] = array[startIndex + 1];
				startIndex++;
			}
		} else {
			while (startIndex > endIndex) {
				array[startIndex] = array[startIndex - 1];
				startIndex--;
			}
		}
		array[endIndex] = startValue;
	}

	/**
	 * Removes elements at indices with complexity time=O(n+m.log(m)) space=O(1)
	 * @param array
	 * @param indices
	 * @returns {[]}
	 */
	static removeByIndices(array: Array<T>, indices: Array<number>): Array<T> {
		const removed = [];
		if (indices.length === 0) {
			return removed;
		}
		indices.sort((a, b) => a - b);
		let skipIndex = 0;
		let index = 0;
		for (;;) {
			while (index + skipIndex === indices[skipIndex] && skipIndex < indices.length) {
				removed.push(array[index + skipIndex]);
				skipIndex++;
			}
			if (index + skipIndex < array.length) {
				array[index] = array[index + skipIndex];
				index++;
			} else {
				break;
			}
		}
		array.splice(index, indices.length);
		return removed;
	}

	/**
	 * Moves elements at from indices to the given toIndices
	 * @param array
	 * @param fromIndices
	 * @param toIndices
	 * @returns {[]}
	 */
	static moveElementByIndicies(array: Array<T>, fromIndices: Array<number>, toIndices: Array<number>): Array<number> {
		fromIndices.sort((a, b) => a - b);
		const tempArray = array.map((value) => value);
		let notUpdatedIndex = true;
		let updatedToIndex = [];
		// Calculating the new to indices
		if (fromIndices[0] < toIndices[0]) {
			const increase = this.updateIndices(fromIndices, toIndices);
			updatedToIndex = toIndices.map((toIndex) => toIndex - increase);
			notUpdatedIndex = false;
		} else {
			updatedToIndex = toIndices.map((toIndex) => toIndex);
		}
		// Moving the ones which are required moving of position
		for (let i = 0; i < fromIndices.length; i++) {
			array[updatedToIndex[i]] = tempArray[fromIndices[i]];
		}

		let currentIndex = 0,
			originalIndex = 0;
		while (currentIndex < tempArray.length) {
			if (!updatedToIndex.includes(currentIndex) && !fromIndices.includes(originalIndex)) {
				array[currentIndex] = tempArray[originalIndex];
				currentIndex++;
				originalIndex++;
			} else if (updatedToIndex.includes(currentIndex) && fromIndices.includes(originalIndex)) {
				currentIndex++;
				originalIndex++;
			} else if (updatedToIndex.includes(currentIndex)) {
				currentIndex++;
			} else if (fromIndices.includes(originalIndex)) {
				originalIndex++;
			}
		}
		if (notUpdatedIndex) {
			for (let i = 0; i < fromIndices.length; i++) {
				updatedToIndex[i] = fromIndices[i] + fromIndices.length;
			}
		}
		return updatedToIndex;
	}

	static updateIndices(fromIndices: Array<number>, toIndices: Array<number>): number {
		let increase = 0;
		for (let i = 0; i < fromIndices.length; i++) {
			if (fromIndices[i] < toIndices[0]) {
				increase++;
			}
		}
		return increase;
	}
	/*
	 * Merges an array into another in-place, into the indices provided.
	 * @param target - target array where new items will be merged in-place, e.g.: [A, C, E, F, H]
	 * @param toMerge - array containing items to be merged into 'target', e.g.: [B, D, G]
	 * @param indices - denotes the final position where the corresponding items will be inserted, e.g.: [1, 3, 6]
	 * @returns target array is modified in-place to [A(0), B(1), C(2), D(3), E(4), F(5), G(6), H(7)]
	 * @note length of toMerge and indices array needs to be same
	 */
	static merge(target: Array<T>, toMerge: Array<T>, indices: Array<number>): void {
		// Combine('zip') indices and toMerge array items so that we can sort them later.
		// This is important as the indices array might not necessarily be sorted
		// and will mess up the final sequence if not explicitly sorted in increasing order.
		const zipped: Array<[number, T]> = indices.map((index, i) => [index, toMerge[i]]);
		// sort in non-decreasing order
		zipped.sort((x, y) => x[0] - y[0]);
		// iterate over sorted (and zipped) pairs of index(0) and value(1) and keep splicing (inserting into the index)
		for (const element of zipped) {
			const pair = element;
			target.splice(pair[0], 0, pair[1]);
		}
	}
}
