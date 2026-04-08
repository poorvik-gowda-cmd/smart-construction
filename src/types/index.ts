export type UserRole = 'admin' | 'engineer' | 'client';

export type ProjectStatus = 'planned' | 'ongoing' | 'on_hold' | 'completed' | 'delayed';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  project_id?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  budget: number;
  start_date?: string;
  end_date?: string;
  location_lat?: number;
  location_lng?: number;
  progress_percent?: number;
}

export interface Labor {
  id: string;
  full_name: string;
  skill_tag: string;
  project_id: string;
  daily_rate: number;
}

export interface Attendance {
  id: string;
  labor_id: string;
  project_id: string;
  date: string;
  status: 'present' | 'absent' | 'overtime';
  overtime_hours: number;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  stock_level: number;
  reorder_point: number;
  project_id: string;
}

export interface Expense {
  id: string;
  project_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface SiteUpdate {
  id: string;
  project_id: string;
  user_id: string;
  image_url: string;
  notes: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface AIRiskResult {
  score: number;
  classification: 'Safe' | 'Moderate' | 'High Risk' | 'Error';
  insight: string;
}
