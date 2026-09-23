import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { MessageCircle, Copy, Check, X, Smartphone, Send, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const WhatsAppSummaryModal: React.FC<Props> = ({ onClose }) => {
  const { generateWhatsAppSummary, storeProfile } = useBusiness();
  const [copied, setCopied] = useState(false);
  const summaryText = generateWhatsAppSummary();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-4 text-white flex items-center justify-between border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/60 rounded-xl">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Business in Your Phone</h3>
              <p className="text-xs text-emerald-200">Daily WhatsApp Executive Summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            The shop owner does not need to sit in the shop to analyze heavy books or complex reports.
            This ready-to-send summary condenses today's sales, true gross profit, daily expenses, debtor balances, and stock alerts.
          </p>

          {/* WhatsApp Chat Preview Bubble */}
          <div className="bg-[#0b141a] rounded-xl p-4 border border-emerald-900/40 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Message Preview</span>
              </div>
              <span>Recipient: Store Owner</span>
            </div>

            <pre className="whitespace-pre-wrap font-sans text-xs text-emerald-50 leading-relaxed bg-[#111b21] p-3.5 rounded-lg border border-emerald-950/60 shadow-inner overflow-x-auto">
              {summaryText}
            </pre>

            <div className="mt-2 text-right">
              <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sent just now • Read ✓✓
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Summary Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 p-3 text-center border-t border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Live data synchronized with Nairobi Hardware shop ledger
          </span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSummaryModal;
