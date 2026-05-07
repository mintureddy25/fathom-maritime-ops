export type Role = 'admin' | 'crew';

export interface Ship {
  id: number;
  name: string;
  imo_number: string;
  type?: string;
  flag?: string;
  status: 'active' | 'docked' | 'retired';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  rank?: string;
  ship_id?: number | null;
  ship?: Ship | null;
  is_active: boolean;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceTask {
  id: number;
  ship_id: number;
  title: string;
  description?: string;
  category?: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  assigned_to?: number | null;
  created_by: number;
  completed_at?: string | null;
  ship?: Ship;
  assignee?: User | null;
  creator?: User;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  body: string;
  createdAt: string;
  author?: { id: number; name: string; role: Role };
}

export type DrillType = 'fire' | 'evacuation' | 'man_overboard' | 'oil_spill' | 'security' | 'medical' | 'other';
export type DrillStatus = 'scheduled' | 'completed' | 'missed';

export interface DrillParticipation {
  id: number;
  drill_id: number;
  user_id: number;
  attended: boolean;
  submitted_at?: string;
  remarks?: string;
  user?: { id: number; name: string; rank?: string };
}

export interface Drill {
  id: number;
  ship_id: number;
  title: string;
  drill_type: DrillType;
  description?: string;
  scheduled_date: string;
  status: DrillStatus;
  created_by: number;
  completed_at?: string | null;
  notes?: string;
  ship?: Ship;
  participations?: DrillParticipation[];
}

export interface ShipCompliance {
  ship: Pick<Ship, 'id' | 'name' | 'imo_number' | 'status'>;
  metrics: {
    maintenance_pct: number;
    drill_completion_pct: number;
    participation_pct: number;
    overall_score: number;
    classification: 'compliant' | 'at_risk' | 'non_compliant';
  };
  counts: {
    tasks_total: number;
    tasks_completed: number;
    tasks_pending: number;
    tasks_overdue: number;
    drills_elapsed: number;
    drills_completed: number;
    drills_missed: number;
    drills_upcoming: number;
  };
  overdue_tasks: { id: number; title: string; due_date: string; status: TaskStatus; priority: TaskPriority }[];
  missed_drills: { id: number; title: string; scheduled_date: string; drill_type: DrillType }[];
}

export interface FleetOverview {
  fleet: {
    ships_total: number;
    tasks_total: number;
    tasks_completed: number;
    tasks_pending: number;
    tasks_overdue: number;
    drills_elapsed: number;
    drills_completed: number;
    drills_missed: number;
    drills_upcoming: number;
    overall_score: number;
    classification: 'compliant' | 'at_risk' | 'non_compliant';
  };
  ships: ShipCompliance[];
}

export interface CrewOverview {
  summary: {
    tasks_total: number;
    tasks_completed: number;
    tasks_in_progress: number;
    tasks_pending: number;
    tasks_overdue: number;
    drills_upcoming: number;
    drills_attended: number;
  };
  tasks: MaintenanceTask[];
  upcoming_drills: Drill[];
  recent_participations: DrillParticipation[];
}
