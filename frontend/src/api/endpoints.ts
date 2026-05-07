import { api } from './client';
import type {
  User, Ship, MaintenanceTask, TaskComment, Drill, DrillParticipation,
  FleetOverview, ShipCompliance, CrewOverview, TaskStatus,
} from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
};

export const shipsApi = {
  list: () => api.get<Ship[]>('/ships').then(r => r.data),
  get: (id: number) => api.get<Ship>(`/ships/${id}`).then(r => r.data),
  create: (body: Partial<Ship>) => api.post<Ship>('/ships', body).then(r => r.data),
  update: (id: number, body: Partial<Ship>) => api.patch<Ship>(`/ships/${id}`, body).then(r => r.data),
};

export const usersApi = {
  list: (params?: { role?: string; ship_id?: number }) =>
    api.get<User[]>('/users', { params }).then(r => r.data),
  create: (body: Partial<User> & { password: string }) =>
    api.post<User>('/users', body).then(r => r.data),
};

export interface TaskFilters {
  ship_id?: number; status?: TaskStatus; assigned_to?: number; overdue?: boolean;
  due_before?: string; due_after?: string;
}

export const tasksApi = {
  list: (filters?: TaskFilters) =>
    api.get<MaintenanceTask[]>('/tasks', { params: filters }).then(r => r.data),
  get: (id: number) => api.get<MaintenanceTask>(`/tasks/${id}`).then(r => r.data),
  create: (body: Partial<MaintenanceTask>) =>
    api.post<MaintenanceTask>('/tasks', body).then(r => r.data),
  setStatus: (id: number, status: TaskStatus) =>
    api.patch<MaintenanceTask>(`/tasks/${id}/status`, { status }).then(r => r.data),
  comment: (id: number, body: string) =>
    api.post<TaskComment>(`/tasks/${id}/comments`, { body }).then(r => r.data),
  remove: (id: number) => api.delete(`/tasks/${id}`).then(r => r.data),
};

export const drillsApi = {
  list: (params?: { ship_id?: number; status?: string; upcoming?: boolean }) =>
    api.get<Drill[]>('/drills', { params }).then(r => r.data),
  get: (id: number) => api.get<Drill>(`/drills/${id}`).then(r => r.data),
  create: (body: Partial<Drill>) => api.post<Drill>('/drills', body).then(r => r.data),
  complete: (id: number, notes?: string) =>
    api.patch<Drill>(`/drills/${id}/complete`, { notes }).then(r => r.data),
  attend: (id: number, attended: boolean, remarks?: string) =>
    api.post<DrillParticipation>(`/drills/${id}/attendance`, { attended, remarks }).then(r => r.data),
};

export const complianceApi = {
  fleet: () => api.get<FleetOverview>('/compliance/fleet').then(r => r.data),
  ship: (id: number) => api.get<ShipCompliance>(`/compliance/ship/${id}`).then(r => r.data),
  crew: () => api.get<CrewOverview>('/compliance/crew').then(r => r.data),
};
