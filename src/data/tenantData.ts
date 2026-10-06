import {
  BusinessIdentity,
  StoreProfile,
  BusinessSubscription,
  Branch,
  Product,
  Customer,
  Sale,
  ConnectedDevice,
  Employee,
} from '../types';
import {
  initialStoreProfile,
  initialBranches,
  initialProducts,
  initialCustomers,
  initialSales,
  initialConnectedDevices,
  initialEmployees,
} from './mockData';

export interface TenantBundle {
  businessIdentity: BusinessIdentity;
  storeProfile: StoreProfile;
  subscription: BusinessSubscription;
  branches: Branch[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  connectedDevices: ConnectedDevice[];
  employees: Employee[];
}

export const tenantRegistry: Record<string, TenantBundle> = {
  // Primary business
  'BUS-8F42K91': {
    businessIdentity: {
      businessId: 'BUS-8F42K91',
      name: 'DMi Business Store',
      ownerName: 'David Migichi',
      ownerEmail: 'migichidave09@gmail.com',
      ownerPhone: '+254 712 345 678',
      hqBranchId: 'branch-1',
      registeredAt: '2025-01-15T08:00:00.000Z',
      taxPin: 'P051982736Z',
      currency: 'KSh',
    },
    storeProfile: initialStoreProfile,
    subscription: {
      tier: 'Business',
      status: 'active',
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      maxBranches: 5,
      maxDevices: 15,
      maxUsers: 25,
      licenseKey: 'DMI-LIC-BUS-8F42-9981-K91P',
      authorizedBy: 'David Migichi (Platform Director)',
      monthlyFee: 2000,
      lastPaymentDate: new Date().toISOString(),
      gracePeriodDays: 7,
      planCode: 'business',
      features: [
        'Single and Multi-branch operation',
        'Carrier M-Pesa automated reconciliation (Till 5331774)',
        'Multi-device real-time sync with conflict resolution',
        'Hardware biometric terminal authentication',
      ],
    },
    branches: initialBranches,
    products: initialProducts,
    customers: initialCustomers,
    sales: initialSales,
    connectedDevices: initialConnectedDevices,
    employees: initialEmployees,
  },
};
