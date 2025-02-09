// @flow
/**
 * Inclusive range for functional iteration. Full range is not materialized until seq() is called. Some functional APIs
 * from Array are implemented directly to avoid any materialization of the range.
 *
 * @author zuye.zheng
 */
export default class RangeSeq {
	+start: number;
	+end: number;

	static exclusive(start: number, end: number): RangeSeq {
		return new RangeSeq(start, end - 1);
	}

	constructor(start: number, end: number) {
		this.start = start;
		this.end = end;
	}

	forEach(f: (number) => void): void {
		for (let i = this.start; i <= this.end; i++) f(i);
	}

	map<A>(f: (number) => A): Array<A> {
		const seq = [];
		for (let i = this.start; i <= this.end; i++) seq.push(f(i));
		return seq;
	}

	seq(): Array<number> {
		return this.map((v) => v);
	}
}
