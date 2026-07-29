export type ProgramType = "stamp" | "points";

export interface LoyaltyProgram {
  id: string;
  org_id: string;
  name: string;
  title: string | null;
  type: ProgramType;
  stamps_required: number;
  points_per_reward: number;
  reward_description: string | null;
  design: { theme?: number; logo?: string; logoImage?: string | null } | null;
  active: boolean;
  created_at: string;
}

export interface Card {
  id: string;
  org_id: string;
  program_id: string;
  customer_id: string;
  serial_number: string;
  stamps: number;
  points: number;
  status: string;
  created_at: string;
}

export interface Customer {
  id: string;
  org_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}
