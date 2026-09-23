import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Users,
  Store,
  CheckCircle2,
  ArrowRight,
  Shield,
  Smartphone,
  MessageCircle,
  X,
  Package,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface GuidedSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedSetupModal: React.FC<GuidedSetupModalProps> = ({ isOpen, onClose }) => {
  const { guidedSetup, updateGuidedSetup, storeProfile, updateStoreProfile } = useBusiness();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState(guidedSetup.businessType || 'Hardware & Building Supplies');
  const [branchesCount, setBranchesCount] = useState(guidedSetup.branchesCount || '2-5 Branches');
  const [employeesCount, setEmployeesCount] = useState(guidedSetup.employeesCount || '6-20 Employees');
  const [activeModules, setActiveModules] = useState<string[]>(
    guidedSetup.modulesEnabled || ['pos', 'multibranch', 'mpesa', 'audit_camera', 'whatsapp']
  );

  if (!isOpen) return null;

  const toggleModule = (mod: string) => {
    setActiveModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleFinish = () => {
    updateGuidedSetup({
      businessType,
      branchesCount,
      employeesCount,
      modulesEnabled: activeModules,
      completed: true,
    });
    updateStoreProfile({
      businessType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">DMi Business Smart Setup</h3>
              <p className="text-blue-100 text-xs">Configure your enterprise architecture in 60 seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step 1: Business Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Step 1 of 4
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">What type of business are you running?</h4>
                <p className="text-xs text-slate-500">
                  Select your primary sector to configure default unit types, inventory categories, and margin defaults.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  'Hardware & Building Supplies',
                  'Retail Supermarket / Minimart',
                  'Agrovet & Veterinary Supplies',
                  'Pharmacy & Chemist',
                  'Wholesale Distributor',
                  'Electronics & Electricals',
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      businessType === type
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{type}</span>
                      {businessType === type && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Branches */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Step 2 of 4
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">How many branch locations do you operate?</h4>
                <p className="text-xs text-slate-500">
                  DMi automatically sets up independent branch inventories, isolated POS registers, and Inter-Branch Transfers (IBT).
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: '1 Single Store', desc: 'Single shop location with central control' },
                  { title: '2-5 Branches', desc: 'Multiple retail shops + central godown/head office' },
                  { title: '6+ Multi-Location Chain', desc: 'Enterprise regional distribution and wholesale branches' },
                ].map((b) => (
                  <button
                    key={b.title}
                    type="button"
                    onClick={() => setBranchesCount(b.title)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      branchesCount === b.title
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{b.desc}</div>
                      </div>
                      {branchesCount === b.title && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Employees */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Step 3 of 4
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">How many staff members need system access?</h4>
                <p className="text-xs text-slate-500">
                  Configures the 5-layer employee access control model so cashiers only see checkout while owners retain financial privacy.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: '1-5 Staff', desc: 'Owner + 2 Cashiers + 1 Storekeeper' },
                  { title: '6-20 Staff', desc: 'Branch Managers, Shift Cashiers, Storekeepers, Drivers' },
                  { title: '20+ Staff', desc: 'Full corporate team with role separation and audit logging' },
                ].map((emp) => (
                  <button
                    key={emp.title}
                    type="button"
                    onClick={() => setEmployeesCount(emp.title)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      employeesCount === emp.title
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{emp.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{emp.desc}</div>
                      </div>
                      {employeesCount === emp.title && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Modules Configuration */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Step 4 of 4
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">Activate Core Enterprise Engines</h4>
                <p className="text-xs text-slate-500">
                  Select which automated systems should be enabled on your DMi Business installation.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'multibranch', name: 'Multi-Branch & Inter-Branch Transfers (IBT)', desc: 'Consolidated owner view & branch stock isolation', icon: Building2 },
                  { id: 'audit_camera', name: 'Immutable Audit Camera & Anomaly Detection', desc: 'Tracks price changes, voids, and cashier overrides', icon: Shield },
                  { id: 'mpesa', name: 'Safaricom Daraja M-Pesa Live Verification', desc: 'STK push and automatic till reconciliation', icon: Smartphone },
                  { id: 'whatsapp', name: 'WhatsApp Receipts & Automated Debt Collection', desc: 'Direct 1-click customer notices and PDF summaries', icon: MessageCircle },
                ].map((mod) => {
                  const ModIcon = mod.icon;
                  const isChecked = activeModules.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked ? 'bg-blue-50/70 border-blue-400' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 mt-0.5 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <ModIcon className="w-3.5 h-3.5 text-blue-600" />
                          {mod.name}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{mod.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Launch System
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
