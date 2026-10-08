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
  initialSubscription,
  emptyBusinessIdentity,
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

/**
 * Real tenants live in Supabase (one row per business, isolated with Row Level Security).
 * This registry is only an in-memory cache of tenants loaded for the current session,
 * so it starts empty: there is no built-in demo business.
 */
export const tenantRegistry: Record<string, TenantBundle> = {};

/** Generates a business ID in the same shape as before, e.g. BUS-8F42K91. */
export function generateBusinessId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return `BUS-${id}`;
}

/**
 * Builds a brand-new, empty tenant for a business that has just signed up.
 * Nothing is pre-filled except what the owner typed in the sign-up form.
 */
export function createEmptyTenantBundle(owner: {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}): TenantBundle {
  const businessId = generateBusinessId();
  const hqBranch = { ...initialBranches[0] };

  return {
    businessIdentity: {
      ...emptyBusinessIdentity,
      businessId,
      name: owner.businessName,
      ownerName: owner.ownerName,
      ownerEmail: owner.ownerEmail,
      ownerPhone: owner.ownerPhone,
      hqBranchId: hqBranch.id,
      registeredAt: new Date().toISOString(),
    },
    storeProfile: { ...initialStoreProfile, name: owner.businessName, phone: owner.ownerPhone },
    subscription: { ...initialSubscription },
    branches: [hqBranch],
    products: [],
    customers: [],
    sales: [],
    connectedDevices: [],
    employees: [],
  };
}
