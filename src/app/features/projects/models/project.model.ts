export interface Project {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'PLANNING' | 'CANCELLED';
  manager: string;
  managerId?: number | string;
  managerInitials: string;
  startDate: string;
  endDate: string;
  budgetUsed: string;
  budgetTotal: string;
  budgetStatus: 'On Track' | 'Over Budget' | 'Under Budget';
  progress: number;
  estimatedCompletion: string;
  manHours: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalSubcontractors: number;
  milestones: Milestone[];
  coordinates: { lat: string; lng: string };
  address: string;
}

export interface Milestone {
  name: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  detail: string;
  progress?: number;
}
