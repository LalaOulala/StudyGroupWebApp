export type Color = "sage" | "clay" | "sky" | "lavender" | "gold";
export interface User {
  id: string;
  name: string;
  color: Color;
}
export type TaskStatus = "todo" | "doing" | "advanced" | "done" | "blocked";
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}
export interface Participant extends User {
  joinedAt: number;
  reviewedAt: number | null;
  reflection: string | null;
  earned: number;
  minutes: number;
  tasks: Task[];
}
export interface SessionSummary {
  id: string;
  title: string;
  room: string;
  duration: number;
  note?: string;
  ownerId?: string;
  createdAt: number;
  endsAt: number;
  endedAt: number | null;
  status: "active" | "ended";
  participantCount: number;
  serverNow: number;
  reviewedAt?: number | null;
  earned?: number;
  minutes?: number;
}
export interface Session extends SessionSummary {
  preview: boolean;
  participants?: Participant[];
  totalXp?: number;
}
export interface Bootstrap {
  user: User | null;
  sessions: SessionSummary[];
  groupXp: number;
  stats: { xp: number; sessions: number; minutes: number; completed: number };
  companions: (User & { sessions: number })[];
}
export interface PageProps {
  data: Bootstrap;
  navigate: (path: string) => void;
  onCreate: () => void;
}
