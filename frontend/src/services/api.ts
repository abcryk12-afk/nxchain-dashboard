import axios from 'axios';
import { 
  AuthResponse, 
  RegisterData, 
  LoginData, 
  DashboardData, 
  DepositData,
  WithdrawalData,
  SupportData,
  Transaction,
  SupportTicket,
  Referral
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nxchain-dashboard.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: async (data: RegisterData): Promise<{ message: string; userId: string }> => {
    const response = await api.post('/register', data);
    return response.data;
  },

  verifyOTP: async (userId: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post('/verify-otp', { userId, otp });
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/login', data);
    return response.data;
  },
};

// Dashboard endpoints
export const dashboard = {
  getData: async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

// Deposit endpoints
export const deposit = {
  create: async (data: DepositData): Promise<{ depositAddress: string; qrCode: string; minimumDeposit: number }> => {
    const response = await api.post('/deposit', data);
    return response.data;
  },
};

// Staking endpoints
export const staking = {
  create: async (packageType: string, amount: number): Promise<{ message: string; stake: any }> => {
    const response = await api.post('/stake', { package: packageType, amount });
    return response.data;
  },
};

// Withdrawal endpoints
export const withdrawal = {
  create: async (data: WithdrawalData): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.post('/withdraw', data);
    return response.data;
  },
};

// Referral endpoints
export const referral = {
  getStats: async (): Promise<{
    referralCode: string;
    referralLink: string;
    totalReferrals: number;
    verifiedReferrals: number;
    totalCommission: number;
    referrals: Referral[];
  }> => {
    const response = await api.get('/referral-stats');
    return response.data;
  },
};

// Support endpoints
export const support = {
  createTicket: async (data: SupportData): Promise<{ message: string; ticket: SupportTicket }> => {
    const response = await api.post('/support', data);
    return response.data;
  },

  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await api.get('/support');
    return response.data;
  },
};

export default api;
