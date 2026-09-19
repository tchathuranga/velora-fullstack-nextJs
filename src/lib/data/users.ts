import { AuthUser } from "@/types/auth";

export interface DemoUser extends AuthUser {
  password: string;
}

function matchUser(list: DemoUser[], username: string, password: string): DemoUser | undefined {
  const normalized = username.trim().toLowerCase();
  return list.find((u) => u.username.toLowerCase() === normalized && u.password === password);
}

export function findDemoUser(users: DemoUser[], username: string, password: string): DemoUser | undefined {
  return matchUser(users, username, password);
}

export function findDemoAdmin(admins: DemoUser[], username: string, password: string): DemoUser | undefined {
  return matchUser(admins, username, password);
}

export function isAdminUsername(admins: DemoUser[], username: string): boolean {
  const normalized = username.trim().toLowerCase();
  return admins.some((u) => u.username.toLowerCase() === normalized);
}

export function getDemoUserByUsername(users: DemoUser[], admins: DemoUser[], username: string): DemoUser | undefined {
  const normalized = username.trim().toLowerCase();
  return [...users, ...admins].find((u) => u.username.toLowerCase() === normalized);
}
