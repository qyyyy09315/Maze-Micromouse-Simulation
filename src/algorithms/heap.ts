/**
 * Binary Min-Heap for A* priority queue.
 * O(log n) push/pop vs O(n) linear scan of plain array.
 */
export class MinHeap<T> {
  private data: T[] = [];
  private cmp: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.cmp = compare;
  }

  get size() {
    return this.data.length;
  }

  get items() {
    return this.data;
  }

  push(item: T) {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    const item = this.data[i];
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.cmp(item, this.data[parent]) >= 0) break;
      this.data[i] = this.data[parent];
      i = parent;
    }
    this.data[i] = item;
  }

  private sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.cmp(this.data[l], this.data[smallest]) < 0) smallest = l;
      if (r < n && this.cmp(this.data[r], this.data[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}
