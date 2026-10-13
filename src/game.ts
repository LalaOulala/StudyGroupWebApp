import type { Task } from "./types";

export const worlds = [
  {
    name: "Le premier pas",
    xp: 0,
    description: "Ton équipe se rassemble. Chaque aventure commence ici.",
    x: 9,
    y: 75,
    symbol: "start",
  },
  {
    name: "Le camp de base",
    xp: 60,
    description: "Un refuge pour préparer toutes vos prochaines quêtes.",
    x: 27,
    y: 57,
    symbol: "tent",
  },
  {
    name: "La forêt des idées",
    xp: 160,
    description: "Les petites avancées ouvrent de nouveaux chemins.",
    x: 47,
    y: 67,
    symbol: "trees",
  },
  {
    name: "Le col des possibles",
    xp: 300,
    description: "Un peu de recul pour mesurer tout le chemin parcouru.",
    x: 64,
    y: 44,
    symbol: "mountain",
  },
  {
    name: "La citadelle du savoir",
    xp: 500,
    description: "Une citadelle construite par vos efforts réunis.",
    x: 80,
    y: 24,
    symbol: "castle",
  },
] as const;

export function playerProgress(xp: number) {
  const safe = Math.max(0, xp);
  return {
    level: Math.floor(safe / 100) + 1,
    progress: safe % 100,
    remaining: 100 - (safe % 100),
  };
}
export function worldProgress(xp: number) {
  const currentIndex = Math.max(
    0,
    worlds.reduce((index, world, i) => (xp >= world.xp ? i : index), 0),
  );
  const current = worlds[currentIndex];
  const next = worlds[currentIndex + 1];
  return {
    currentIndex,
    current,
    next,
    percent: next
      ? Math.max(
          0,
          Math.min(100, ((xp - current.xp) / (next.xp - current.xp)) * 100),
        )
      : 100,
  };
}
export function questProgress(tasks: Pick<Task, "status">[]) {
  return tasks.length
    ? Math.round(
        (tasks.reduce(
          (total, task) =>
            total +
            (task.status === "done" ? 1 : task.status === "advanced" ? 0.5 : 0),
          0,
        ) /
          tasks.length) *
          100,
      )
    : 0;
}
