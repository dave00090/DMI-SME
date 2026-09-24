import React, { useState } from 'react';
import {
  Users,
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Employee, UserRole } from '../types';
import { supabaseAuth } from '../lib/supabase';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({ isOpen, onClose }) => {
  const { employees, currentEmployee, switchEmployeeByPin, branches } = useBusiness();
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Strict User Requirement: "In the switch user tab it should only be visible to the owner"
  if (currentEmployee.role !== 'owner') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-rose-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Owner Access Only</h3>
          <p className="text-xs text-slate-600">
            The fast Switch User terminal is exclusively reserved for the Business Owner ({employees.find(e => e.role === 'owner')?.name || 'Owner'}). Staff members must sign in through their individual credentials at the Login Dashboard.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    );
  }

  const handleSelectEmp = (emp: Employee) => {
    setSelectedEmp(emp);
    setPin('');
    setError('');
    setFeedback(null);
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleAuthenticate = (inputPin?: string) => {
    const pinToTest = inputPin || pin;
    if (pinToTest.length !== 4) {
      setError('Please provide a 4-digit PIN');
      return;
    }

    const res = switchEmployeeByPin(pinToTest);
    if (res.success) {
      // Also sync active cashier in local Supabase / SQLite session layer
      const staffList = employees.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        pin: e.pin,
        branchId: e.branchId,
      }));
      supabaseAuth.switchCashierByPin(pinToTest, staffList);

      setFeedback(res.message);
      setError('');
      setTimeout(() => {
        onClose();
        setSelectedEmp(null);
        setPin('');
        setFeedback(null);
      }, 600);
    } else {
      setError(res.message);
      setPin('');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cashier':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'storekeeper':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Employee Selection List */}
        <div className="w-full md:w-3/5 p-6 border-b md:border-b-0 md:border-r border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Switch User Terminal</h3>
                <p className="text-xs text-slate-500">Select employee persona & enter PIN</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {employees.map((emp) => {
              const isCurrent = emp.id === currentEmployee.id;
              const isSelected = selectedEmp?.id === emp.id;
              const isDisabled = emp.status === 'disabled';

              return (
                <div
                  key={emp.id}
                  onClick={() => !isDisabled && handleSelectEmp(emp)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isDisabled
                      ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                      : isCurrent
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {emp.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      {isCurrent && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">{emp.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {emp.branchName}
                        </span>
                        <span>•</span>
                        <span>PIN: {emp.pin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleColor(
                        emp.role
                      )}`}
                    >
                      {emp.role.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEmp(emp);
                        handleAuthenticate(emp.pin);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      1-Click Login
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Enterprise Multi-User Mode</span>
            <span className="font-semibold text-slate-700">Audit Camera Active</span>
          </div>
        </div>

        {/* Right: Keypad / Authentication */}
        <div className="w-full md:w-2/5 p-6 bg-slate-50 flex flex-col justify-between">
          <div className="flex justify-between items-center md:hidden">
            <span className="text-xs font-semibold text-slate-500">PIN Verification</span>
          </div>

          <div className="text-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center mb-2 shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {selectedEmp?.name ? `Authenticate ${selectedEmp.name}` : 'Select an Employee'}
            </h4>
            <p className="text-xs text-slate-500">
              {selectedEmp
                ? `Enter 4-digit PIN for ${(selectedEmp.role || 'STAFF').toUpperCase()}`
                : 'Click an employee on the left to enter PIN'}
            </p>
          </div>

          {/* PIN dots */}
          <div className="my-2">
            <div className="flex justify-center items-center gap-2 mb-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border-2 transition-all ${
                      filled
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {filled ? (showPin ? pin[idx] : '•') : ''}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            {feedback && (
              <p className="text-xs font-semibold text-emerald-600 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {feedback}
              </p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto w-full mb-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={!selectedEmp}
                onClick={() => handleKeyPress(digit)}
                className="h-10 text-base font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-lg text-slate-800 transition-colors shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={!selectedEmp}
              onClick={() => setPin('')}
              className="h-10 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 rounded-lg text-slate-600"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!selectedEmp}
              onClick={() => handleKeyPress('0')}
              className="h-10 text-base font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-800"
            >
              0
            </button>
            <button
              type="button"
              disabled={!selectedEmp}
              onClick={handleBackspace}
              className="h-10 text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 rounded-lg text-slate-600"
            >
              ⌫
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleAuthenticate()}
              disabled={!selectedEmp || pin.length !== 4}
              className="w-1/2 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" /> Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
