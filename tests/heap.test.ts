import { describe, it, expect } from 'vitest';
import { MinHeap } from '../src/algorithms/heap';

describe('MinHeap', () => {
  it('should maintain min-heap property', () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    heap.push(5);
    heap.push(3);
    heap.push(7);
    heap.push(1);

    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(3);
    expect(heap.pop()).toBe(5);
    expect(heap.pop()).toBe(7);
  });

  it('should handle empty pop', () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    expect(heap.pop()).toBeUndefined();
  });

  it('should report correct size', () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    expect(heap.size).toBe(0);
    heap.push(10);
    expect(heap.size).toBe(1);
    heap.push(5);
    expect(heap.size).toBe(2);
    heap.pop();
    expect(heap.size).toBe(1);
  });

  it('should handle duplicate values', () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    heap.push(3);
    heap.push(3);
    heap.push(1);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(3);
    expect(heap.pop()).toBe(3);
  });
});
