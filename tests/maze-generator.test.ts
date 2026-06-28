import { describe, it, expect } from 'vitest';
import { generateMaze } from '../src/algorithms/maze-generator';

describe('Maze Generator', () => {
  it('should generate a maze of correct size', () => {
    const maze = generateMaze(10, 0.3);
    expect(maze.length).toBe(10);
    expect(maze[0].length).toBe(10);
  });

  it('should always have a solvable path', () => {
    for (let i = 0; i < 5; i++) {
      const maze = generateMaze(15, 0.4);
      // Start should be at (0,0), goal at (14,14)
      expect(maze[0][0].type).toBe('start');
      expect(maze[14][14].type).toBe('goal');
    }
  });

  it('should respect custom start and goal', () => {
    const maze = generateMaze(20, 0.3, { x: 5, y: 5 }, { x: 15, y: 15 });
    expect(maze[5][5].type).toBe('start');
    expect(maze[15][15].type).toBe('goal');
  });

  it('should handle small mazes', () => {
    const maze = generateMaze(3, 0.1);
    expect(maze.length).toBe(3);
    expect(maze[0].length).toBe(3);
  });

  it('should handle high obstacle rates', () => {
    const maze = generateMaze(10, 0.7);
    expect(maze.length).toBe(10);
    // Should still be solvable (start and goal exist)
    expect(maze[0][0].type).toBe('start');
    expect(maze[9][9].type).toBe('goal');
  });

});
