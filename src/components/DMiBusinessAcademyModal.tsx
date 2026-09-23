import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Users,
  Building2,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  DollarSign,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface DMiBusinessAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopicId?: string;
}

interface Topic {
  id: string;
  title: string;
  category: string;
  readingTime: string;
  icon: any;
  summary: string;
  keyPoints: string[];
  practicalRule: string;
}

const TOPICS: Topic[] = [
  {
    id: 'dashboard-profit',
    title: "How to Read Today's Dashboard: Gross vs. Net Profit",
    category: 'Financial Mastery',
    readingTime: '45 sec read',
    icon: TrendingUp,
    summary:
      'High daily sales can be deceptive. A hardware shop making KSh 200,000 in sales might be losing money if margins are thin and casual expenses run untracked.',
    keyPoints: [
      'Gross Profit = Selling Price minus Cost Price. It is the money made strictly from trading products.',
      'Net Profit = Gross Profit minus Daily Operating Expenses (Rent, Casual Labour, Boda Transport, Electricity).',
      'If Net Profit is negative despite high sales, your product markup is too low or casual daily cash deductions are draining the business.',
      'Cash Flow Rule: Outstanding credit to customers (Madeni) is NOT profit until the cash lands in your M-Pesa or Till.',
    ],
    practicalRule:
      'Rule of Thumb: Target at least 18% - 25% gross margin across hardware items. Use fast-moving cement to attract buyers, but make your real profit on fittings, paint, and fasteners.',
  },
  {
    id: 'stock-theft',
    title: 'How to Identify Stolen or Missing Stock',
    category: 'Inventory Security',
    readingTime: '60 sec read',
    icon: Package,
    summary:
      'Stock shrinkage rarely happens as a single large robbery. In 90% of Kenyan retail businesses, it occurs through daily unrecorded bags of cement, bent iron sheets, or unbilled paint brushes.',
    keyPoints: [
      'Never allow employees to edit inventory counts without supervisor authorization.',
      'Review the DMi Audit Camera daily: Look for frequent "Stock Adjustments" citing damage or breakage.',
      'Perform surprise physical spot-checks on 5 random high-value items every Tuesday and Friday.',
      'Ensure every delivery to the store is received against an official Supplier Delivery Note before hitting the shelves.',
    ],
    practicalRule:
      'The "Security Camera" Rule: If an item is missing, never delete it. Adjust it with a mandatory reason note and track which staff member signed for that shift.',
  },
  {
    id: 'credit-debtors',
    title: 'How to Manage Credit Customers & Prevent Bad Debts',
    category: 'Debt Management',
    readingTime: '50 sec read',
    icon: DollarSign,
    summary:
      'Extending credit to trusted "Fundis" and building contractors is essential for Kenyan hardware growth, but unmonitored debt will choke your working capital.',
    keyPoints: [
      'Set strict individual credit limits before releasing goods (e.g. KSh 20,000 max).',
      'Never issue new credit if a previous invoice has exceeded its 14-day due date.',
      'Use DMi automated WhatsApp Reminders: Send the Friendly reminder at 7 days, and Urgent reminder on due date.',
      'Always link M-Pesa payments directly to the customer profile to keep an airtight reconciliation trail.',
    ],
    practicalRule:
      'Golden Debt Rule: Profit is just an opinion; cash in the bank is reality. If 30% of your sales are on credit, you need 30% extra working capital to survive supplier restocks.',
  },
  {
    id: 'employee-control',
    title: 'How to Add & Control Employees Safely (5-Layer RBAC)',
    category: 'Staff Management',
    readingTime: '45 sec read',
    icon: ShieldCheck,
    summary:
      'Don’t design the business around blind trust. Design it so employees can perform their jobs efficiently without being given unnecessary control.',
    keyPoints: [
      'Cashiers should only see POS and their own Daily Sales Register. They do NOT need to see company profit, cost prices, or owner expenses.',
      'Enforce the 5% Discount Threshold: Any discount exceeding 5% requires a Manager PIN.',
      'Never allow single-person refunds: A cashier must call a manager to authorize any refund above KSh 2,000.',
      'Each staff member must have their own unique 4-digit PIN. Never share owner credentials.',
    ],
    practicalRule:
      'Management Principle: Good security protects honest employees. When cash and stock balance every evening, no innocent staff member can be wrongfully suspected.',
  },
  {
    id: 'multi-branch',
    title: 'How to Scale to Multiple Branches & Central Warehouse',
    category: 'Expansion & Scale',
    readingTime: '60 sec read',
    icon: Building2,
    summary:
      'Opening Branch 2 (e.g. Thika or Rongai) should not multiply your stress. Structure your central supply chain so you control everything from Head Office.',
    keyPoints: [
      'Purchase in bulk from primary manufacturers at Head Office godown to capture maximum volume discounts.',
      'Move stock to branches exclusively via Inter-Branch Transfers (IBT) with vehicle registration and driver tracking.',
      'The receiving branch manager must inspect and digitally accept the transfer before goods become sellable.',
      'Use Consolidated Enterprise View on DMi to compare branch turnover side-by-side every evening.',
    ],
    practicalRule:
      'Branch Expansion Rule: Never open Branch 2 until Branch 1 can run smoothly for 14 consecutive days without the owner physically standing behind the till.',
  },
];

export const DMiBusinessAcademyModal: React.FC<DMiBusinessAcademyModalProps> = ({
  isOpen,
  onClose,
  initialTopicId,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || TOPICS[0].id
  );

  if (!isOpen) return null;

  const currentTopic = TOPICS.find((t) => t.id === selectedTopicId) || TOPICS[0];
  const Icon = currentTopic.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        {/* Left Topics Navigation */}
        <div className="w-full md:w-1/3 bg-slate-50 p-5 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">DMi Business Academy</h3>
                <p className="text-[11px] text-slate-500">Practical 60-second micro-guides</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {TOPICS.map((topic) => {
                const isSelected = topic.id === currentTopic.id;
                const TopicIcon = topic.icon;

                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TopicIcon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-white' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-semibold line-clamp-1">{topic.title}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kenyan Retail Playbook</span>
            <span className="font-semibold text-slate-700">Hardware Edition</span>
          </div>
        </div>

        {/* Right Topic Detail */}
        <div className="w-full md:w-2/3 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                    {currentTopic.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentTopic.readingTime}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentTopic.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-4 text-xs text-slate-700 leading-relaxed">
              {currentTopic.summary}
            </div>

            {/* Core Action Points */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Core Execution Principles:
              </h4>
              {currentTopic.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
            </div>

            {/* Practical Rule Box */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Practical Business Rule
              </div>
              <p className="leading-relaxed">{currentTopic.practicalRule}</p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Built for Serious Kenyan Entrepreneurs</span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Got It, Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
