import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Customer, Supplier, Employee, UserRole } from '../types';
import { getRoleDefaultPermissions } from '../data/mockData';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Shield,
  Truck,
  UserCheck,
  Building2,
  ExternalLink,
  MessageSquare,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  UserPlus,
  Briefcase,
  Store,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

export type ContactType = 'all' | 'customer' | 'staff' | 'supplier';

interface UnifiedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  type: 'customer' | 'staff' | 'supplier';
  // Specific data
  customerData?: Customer;
  staffData?: Employee;
  supplierData?: Supplier;
}

export const ContactsManager: React.FC = () => {
  const {
    customers,
    suppliers,
    employees,
    branches,
    setActiveTab,
    addCustomer,
    addSupplier,
    addEmployee,
    currentEmployee,
  } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContactType>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addContactType, setAddContactType] = useState<'customer' | 'staff' | 'supplier'>('customer');

  // Add contact form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  // Customer specific
  const [newCreditLimit, setNewCreditLimit] = useState(10000);
  // Staff specific
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [newBranchId, setNewBranchId] = useState('branch-1');
  const [newPin, setNewPin] = useState('1234');
  // Supplier specific
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPaymentTerms, setNewPaymentTerms] = useState('30 Days');

  // Combine all three directories into a unified list
  const unifiedContacts = useMemo<UnifiedContact[]>(() => {
    const list: UnifiedContact[] = [];

    // Add Customers
    customers.forEach((c) => {
      list.push({
        id: `cust-${c.id}`,
        name: c.name,
        phone: c.phone,
        email: undefined,
        location: c.location || 'Local Buyer',
        type: 'customer',
        customerData: c,
      });
    });

    // Add Staff
    employees.forEach((e) => {
      list.push({
        id: `staff-${e.id}`,
        name: e.name,
        phone: e.phone || '',
        email: e.email,
        location: e.branchName || 'All Branches',
        type: 'staff',
        staffData: e,
      });
    });

    // Add Suppliers
    suppliers.forEach((s) => {
      list.push({
        id: `supp-${s.id}`,
        name: s.name,
        phone: s.phone,
        email: undefined,
        location: s.location || 'Distributor HQ',
        type: 'supplier',
        supplierData: s,
      });
    });

    return list;
  }, [customers, employees, suppliers]);

  // Filtered contacts based on search and type
  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return unifiedContacts.filter((contact) => {
      // Type filter
      if (selectedType !== 'all' && contact.type !== selectedType) {
        return false;
      }

      // Branch filter (mainly applies to staff, but allows all if 'all')
      if (selectedBranchFilter !== 'all') {
        if (contact.type === 'staff') {
          if (contact.staffData?.branchId !== selectedBranchFilter && contact.staffData?.branchId !== 'all') {
            return false;
          }
        }
      }

      // Search matching
      if (!query) return true;

      const matchName = (contact.name || '').toLowerCase().includes(query);
      const matchPhone = (contact.phone || '').toLowerCase().includes(query);
      const matchEmail = (contact.email || '').toLowerCase().includes(query);
      const matchLocation = (contact.location || '').toLowerCase().includes(query);

      let matchExtra = false;
      if (contact.type === 'customer') {
        matchExtra = (contact.customerData?.status || '').toLowerCase().includes(query);
      } else if (contact.type === 'staff') {
        matchExtra =
          (contact.staffData?.role || '').toLowerCase().includes(query) ||
          (contact.staffData?.branchName || '').toLowerCase().includes(query);
      } else if (contact.type === 'supplier') {
        matchExtra =
          (contact.supplierData?.contactPerson || '').toLowerCase().includes(query) ||
          (contact.supplierData?.category || '').toLowerCase().includes(query);
      }

      return matchName || matchPhone || matchEmail || matchLocation || matchExtra;
    });
  }, [unifiedContacts, searchQuery, selectedType, selectedBranchFilter]);

  // Counts
  const counts = {
    all: unifiedContacts.length,
    customer: customers.length,
    staff: employees.length,
    supplier: suppliers.length,
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    if (addContactType === 'customer') {
      addCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        location: newLocation.trim() || 'Nairobi',
        creditLimit: Number(newCreditLimit) || 10000,
      });
    } else if (addContactType === 'staff') {
      const branchObj = branches.find((b) => b.id === newBranchId);
      addEmployee({
        name: newName.trim(),
        role: newRole,
        branchId: newRole === 'owner' ? 'all' : newBranchId,
        branchName: newRole === 'owner' ? 'All Outlets' : branchObj?.name || 'Main Branch',
        pin: newPin.trim() || '1234',
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        status: 'active',
        permissions: getRoleDefaultPermissions(newRole),
      });
    } else if (addContactType === 'supplier') {
      addSupplier({
        name: newName.trim(),
        phone: newPhone.trim(),
        contactPerson: newContactPerson.trim() || 'Sales Representative',
        location: newLocation.trim() || 'Industrial Area',
        category: newCategory.trim() || 'General Hardware',
        paymentTerms: newPaymentTerms.trim() || '30 Days',
        catalog: [],
      });
    }

    // Reset and close
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewLocation('');
    setNewContactPerson('');
    setNewCategory('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Contacts Directory
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Unified phonebook of registered customers, suppliers, and staff across all branches
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Contact</span>
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 pt-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Contacts</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                selectedType === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedType('customer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedType === 'customer'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customers</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                selectedType === 'customer'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              {counts.customer}
            </span>
          </button>

          <button
            onClick={() => setSelectedType('staff')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedType === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Staff</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                selectedType === 'staff' ? 'bg-indigo-800 text-white' : 'bg-indigo-200 text-indigo-900'
              }`}
            >
              {counts.staff}
            </span>
          </button>

          <button
            onClick={() => setSelectedType('supplier')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedType === 'supplier'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                selectedType === 'supplier' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {counts.supplier}
            </span>
          </button>
        </div>

        {/* Search Bar & Branch Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-slate-100 mt-4">
          <div className="sm:col-span-8 lg:col-span-9 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone number, email, location, role, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4 lg:col-span-3">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="all">📍 All Outlets Context</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Quick Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{filteredContacts.length}</strong> of {unifiedContacts.length} contacts
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Customer
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Staff
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Supplier
          </span>
        </div>
      </div>

      {/* Contacts Cards Grid */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No contacts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No contacts match your current filter or search criteria. Try modifying your search term or switch to &quot;All Contacts&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const isCustomer = contact.type === 'customer';
            const isStaff = contact.type === 'staff';
            const isSupplier = contact.type === 'supplier';

            // Clean phone for wa.me
            const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
            const waPhone = cleanPhone.startsWith('0')
              ? '254' + cleanPhone.slice(1)
              : cleanPhone.startsWith('254')
              ? cleanPhone
              : cleanPhone;

            return (
              <div
                key={contact.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header: Name + Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCustomer
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isStaff
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isCustomer && <UserCheck className="w-5 h-5" />}
                        {isStaff && <Shield className="w-5 h-5" />}
                        {isSupplier && <Truck className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                          {contact.name}
                        </h3>
                        {contact.location && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{contact.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Distinct Badges for Customer / Staff / Supplier */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 font-mono ${
                        isCustomer
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isStaff
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isCustomer && 'Customer'}
                      {isStaff && 'Staff'}
                      {isSupplier && 'Supplier'}
                    </span>
                  </div>

                  {/* Contact Info Rows */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Phone:</span>
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-mono font-bold text-slate-800 hover:text-emerald-600 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{contact.phone || 'N/A'}</span>
                      </a>
                    </div>

                    {contact.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Email:</span>
                        <a
                          href={`mailto:${contact.email}`}
                          className="font-mono text-slate-700 hover:text-blue-600 flex items-center gap-1 truncate max-w-[180px]"
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      </div>
                    )}

                    {/* Type-Specific Meta */}
                    {isCustomer && contact.customerData && (
                      <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 mt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-800 font-medium">Debt (Madeni):</span>
                          <span
                            className={`font-mono font-bold ${
                              contact.customerData.outstandingDebt > 0
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            KSh {contact.customerData.outstandingDebt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Credit Limit:</span>
                          <span className="font-mono">
                            KSh {contact.customerData.creditLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Account Status:</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              contact.customerData.status === 'good'
                                ? 'bg-emerald-100 text-emerald-800'
                                : contact.customerData.status === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {contact.customerData.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {isStaff && contact.staffData && (
                      <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 mt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-800 font-medium">Assigned Role:</span>
                          <span className="bg-indigo-200/80 text-indigo-900 font-bold px-1.5 py-0.2 rounded uppercase text-[10px]">
                            {contact.staffData.role}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Outlet / Branch:</span>
                          <strong className="text-slate-800">
                            {contact.staffData.branchName}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Terminal Status:</span>
                          <span
                            className={`font-semibold ${
                              contact.staffData.status === 'active'
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            ● {contact.staffData.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}

                    {isSupplier && contact.supplierData && (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 mt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-800 font-medium">Contact Person:</span>
                          <strong className="text-slate-800">
                            {contact.supplierData.contactPerson}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Category:</span>
                          <span className="bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-medium text-[10px]">
                            {contact.supplierData.category || 'General Supplies'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Balance Owed:</span>
                          <span className="font-mono font-bold text-amber-900">
                            KSh {contact.supplierData.balanceOwed.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons (Call, WhatsApp, Jump to Module) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {contact.phone && (
                      <>
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title={`Call ${contact.name}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition"
                          title={`Chat on WhatsApp with ${contact.name}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>

                  {/* Module Jump Button */}
                  {isCustomer && (
                    <button
                      onClick={() => setActiveTab('debtors')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Debt Ledger</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  {isStaff && (
                    <button
                      onClick={() => setActiveTab('staff-security')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Staff & RBAC</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  {isSupplier && (
                    <button
                      onClick={() => setActiveTab('suppliers')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Supplier Ledger</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Add New Contact</h3>
                  <p className="text-slate-400 text-xs">
                    Register a new customer, staff member, or supplier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="p-6 space-y-4">
              {/* Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Contact Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddContactType('customer')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      addContactType === 'customer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddContactType('staff')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      addContactType === 'staff'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddContactType('supplier')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      addContactType === 'supplier'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>Supplier</span>
                  </button>
                </div>
              </div>

              {/* Shared Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={
                      addContactType === 'customer'
                        ? 'e.g. John Mwangi'
                        : addContactType === 'staff'
                        ? 'e.g. Grace Wambui'
                        : 'e.g. Bamburi Cement Ltd'
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone Number (M-Pesa / Call) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Location / Area / Town
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Gikomba, Nairobi"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="contact@business.co.ke"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Customer Specific Fields */}
              {addContactType === 'customer' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <label className="text-xs font-bold text-emerald-900 block mb-1">
                    Credit Limit (Madeni Ceiling KSh)
                  </label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Staff Specific Fields */}
              {addContactType === 'staff' && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-indigo-900 block mb-1">
                        Assigned Role
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                      >
                        <option value="cashier">Cashier</option>
                        <option value="storekeeper">Storekeeper</option>
                        <option value="manager">Manager</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-indigo-900 block mb-1">
                        Assigned Outlet
                      </label>
                      <select
                        value={newBranchId}
                        onChange={(e) => setNewBranchId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-indigo-900 block mb-1">
                      Terminal Login PIN (4 digits)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="1234"
                      className="w-32 px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-mono tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Supplier Specific Fields */}
              {addContactType === 'supplier' && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-amber-900 block mb-1">
                        Contact Person / Rep
                      </label>
                      <input
                        type="text"
                        value={newContactPerson}
                        onChange={(e) => setNewContactPerson(e.target.value)}
                        placeholder="e.g. Sales Agent Kelvin"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-amber-900 block mb-1">
                        Supply Category
                      </label>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g. Hardware & Cement"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={newPaymentTerms}
                      onChange={(e) => setNewPaymentTerms(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-amber-600 focus:outline-hidden"
                    >
                      <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                      <option value="14 Days">14 Days Invoice</option>
                      <option value="30 Days">30 Days Credit</option>
                      <option value="60 Days">60 Days Credit</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;
