export interface User {
  id: string;
  email: string;
  referralCode: string;
  balance: number;
  totalEarnings: number;
  referralEarnings: number;
  withdrawableBalance: number;
  pendingEarnings: number;
  isVerified: boolean;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'staking' | 'referral';
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'approved';
  description: string;
  createdAt: string;
}

export interface Staking {
  _id: string;
  userId: string;
  package: 'bronze' | 'silver' | 'gold';
  amount: number;
  dailyReturn: number;
  totalDays: number;
  totalROI: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalEarned: number;
}

export interface Referral {
  _id: string;
  referrerId: string;
  referredUserId: {
    email: string;
    createdAt: string;
    isVerified: boolean;
  };
  level: number;
  commission: number;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  response: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  user: User;
  transactions: Transaction[];
  activeStakes: Staking[];
  referrals: Referral[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface StakingPackage {
  name: 'bronze' | 'silver' | 'gold';
  displayName: string;
  duration: number;
  dailyReturn: number;
  totalROI: number;
  minAmount: number;
  color: string;
}

export interface DepositData {
  amount: number;
}

export interface WithdrawalData {
  amount: number;
  walletAddress: string;
  note?: string;
}

export interface SupportData {
  subject: string;
  message: string;
}
