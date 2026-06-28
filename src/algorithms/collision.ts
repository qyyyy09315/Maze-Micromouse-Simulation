import type { Agent, Position, Maze } from '../types';
import { COLLISION_MAX_ROUNDS } from '../types';

/**
 * Check and resolve collisions between agents.
 * When two or more agents occupy the same cell, the lowest-ID agent keeps
 * the position; others step back to their previous position (if available
 * and unoccupied), or find a random valid neighbor.
 *
 * Returns collision events for optional notification.
 */
export function checkCollisions(
  agents: Agent[],
  maze: Maze,
  mazeSize: number,
): string[] {
  const positionMap = new Map<string, number[]>();
  const collisionEvents: string[] = [];
  const agentsToAdjust = new Set<number>();

  // Collect agents by position
  for (const agent of agents) {
    if (!agent.isActive || !agent.position) continue;
    const key = `${agent.position.x},${agent.position.y}`;
    const list = positionMap.get(key);
    if (list) {
      list.push(agent.id);
    } else {
      positionMap.set(key, [agent.id]);
    }
  }

  // Resolve collisions — iterate until no overlaps remain
  const maxRounds = COLLISION_MAX_ROUNDS;
  for (let round = 0; round < maxRounds; round++) {
    const currentMap = new Map<string, number[]>();
    for (const agent of agents) {
      if (!agent.isActive || !agent.position) continue;
      const key = `${agent.position.x},${agent.position.y}`;
      const list = currentMap.get(key);
      if (list) {
        list.push(agent.id);
      } else {
        currentMap.set(key, [agent.id]);
      }
    }

    let resolved = true;
    for (const [, ids] of currentMap) {
      if (ids.length < 2) continue;
      resolved = false;

      ids.sort((a, b) => a - b);
      // Lowest ID has priority; others step back
      for (let i = 1; i < ids.length; i++) {
        const agent = agents[ids[i]];
        agentsToAdjust.add(agent.id);
        agent.collisions++;

        // Try stepping back to actual previous position first
        if (agent.previousPosition && isValid(agent.previousPosition, mazeSize)) {
          const backKey = `${agent.previousPosition.x},${agent.previousPosition.y}`;
          const occupants = currentMap.get(backKey);
          // Only step back if previous position is unoccupied
          if (!occupants || occupants.length === 0) {
            agent.position = { ...agent.previousPosition };
            agent.stepsTaken = Math.max(0, agent.stepsTaken - 1);
            agent.previousPosition = null;
            continue;
          }
        }

        // Fallback: find a random valid, unoccupied neighbor
        const dirs = [
          { x: 0, y: -1 }, { x: 1, y: 0 },
          { x: 0, y: 1 }, { x: -1, y: 0 },
        ];
        const valid = dirs
          .map(d => ({ x: agent.position.x + d.x, y: agent.position.y + d.y }))
          .filter(p => {
            if (!isValid(p, mazeSize)) return false;
            if (maze[p.y][p.x].type === 'obstacle') return false;
            // Check no other agent is at this cell
            const key = `${p.x},${p.y}`;
            return !currentMap.has(key) || (currentMap.get(key)?.length ?? 0) === 0;
          });
        if (valid.length > 0) {
          agent.position = valid[Math.floor(Math.random() * valid.length)];
          agent.previousPosition = null;
        }
        // If no valid neighbor, agent stays (will be re-checked next round)
      }
    }

    // Collect collision events for this round
    if (round === 0) {
      for (const [, ids] of positionMap) {
        if (ids.length < 2) continue;
        const names = ids.map(id => `${id + 1}`).join(' 与 ');
        collisionEvents.push(names);
      }
    }

    if (resolved) break;
  }

  return collisionEvents;
}

function isValid(p: Position, size: number): boolean {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}
