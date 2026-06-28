import type { Agent, Position, Maze } from '../types';

/**
 * Check and resolve collisions between agents.
 * When two agents occupy the same cell, the higher-ID agent steps back.
 * Returns collision events for optional notification.
 */
export function checkCollisions(
  agents: Agent[],
  maze: Maze,
  mazeSize: number,
): string[] {
  const positionMap = new Map<string, number[]>();
  const collisionEvents: string[] = [];

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

  // Resolve collisions
  for (const [, ids] of positionMap) {
    if (ids.length < 2) continue;

    ids.sort((a, b) => a - b);
    // Lowest ID has priority; others step back
    for (let i = 1; i < ids.length; i++) {
      const agent = agents[ids[i]];
      agent.collisions++;

      if (agent.path && agent.stepsTaken > 0) {
        // Step back along path
        const prevPos = agent.path[agent.stepsTaken - 1];
        if (prevPos && isValid(prevPos, mazeSize)) {
          agent.position = { ...prevPos };
          agent.stepsTaken = Math.max(0, agent.stepsTaken - 1);
        }
      } else {
        // Random valid neighbor
        const dirs = [
          { x: 0, y: -1 }, { x: 1, y: 0 },
          { x: 0, y: 1 }, { x: -1, y: 0 },
        ];
        const valid = dirs
          .map(d => ({ x: agent.position.x + d.x, y: agent.position.y + d.y }))
          .filter(
            p =>
              isValid(p, mazeSize) &&
              maze[p.y][p.x].type !== 'obstacle' &&
              !agents.some(
                a => a.isActive && a.position && a.position.x === p.x && a.position.y === p.y,
              ),
          );
        if (valid.length > 0) {
          agent.position = valid[Math.floor(Math.random() * valid.length)];
        }
      }
    }

    const names = ids.map(id => `${id + 1}`).join(' 与 ');
    collisionEvents.push(names);
  }

  return collisionEvents;
}

function isValid(p: Position, size: number): boolean {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}
