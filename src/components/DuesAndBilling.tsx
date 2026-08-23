import React, { useState } from 'react';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  ShieldCheck, 
  DollarSign, 
  X,
  Building,
  Check
} from 'lucide-react';
import { MaintenanceBill, CurrentUser } from '../types';

interface DuesAndBillingProps {
  bills: MaintenanceBill[];
  currentUser: CurrentUser;
  onPayBill: (billId: string, method: string) => void;
}

export const DuesAndBilling: React.FC<DuesAndBillingProps> = ({
  bills,
  currentUser,
  onPayBill
}) => {
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<MaintenanceBill | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<MaintenanceBill | null>(null);

  const pendingBill = bills.find(b => b.status === 'PENDING' || b.status === 'OVERDUE');

  const handleExecutePayment = () => {
    if (!selectedBillForPayment) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      onPayBill(selectedBillForPayment.id, selectedPaymentMethod);
      setIsProcessingPayment(false);
      const updated = {
        ...selectedBillForPayment,
        status: 'PAID' as const,
        paidDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        transactionId: `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        paymentMethod: selectedPaymentMethod
      };
      setPaymentSuccessReceipt(updated);
      setSelectedBillForPayment(null);
    }, 900);
  };

  return (
    <div className="space-y-6">
      
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1F2937] shadow-lg flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400">Total Outstanding</h3>
            <div className="bg-teal-500/10 p-2 rounded-lg text-teal-400 border border-teal-500/20"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">₹{bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
          </div>
        </div>
        
        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1F2937] shadow-lg flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400">Overdue Dues</h3>
            <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400 border border-rose-500/20"><AlertCircle className="w-5 h-5" /></div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">₹{bills.filter(b => b.status === 'OVERDUE').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1F2937] shadow-lg flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400">Latest Payment</h3>
            <div className="bg-teal-500/10 p-2 rounded-lg text-teal-400 border border-teal-500/20"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <div>
            {bills.filter(b => b.status === 'PAID').length > 0 ? (
                <>
                    <span className="text-xl font-extrabold text-white block mb-1">₹{bills.filter(b => b.status === 'PAID')[0].amount.toFixed(2)}</span>
                    <span className="text-xs text-slate-500 font-medium">Paid on {bills.filter(b => b.status === 'PAID')[0].paidDate}</span>
                </>
            ) : (
                <span className="text-sm text-slate-500">No recent payments</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Month Active Due Banner */}
      {pendingBill ? (
        <div className="bg-gradient-to-br from-teal-900/40 via-[#111827] to-[#111827] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Due by {pendingBill.dueDate}
                </span>
                <span className="text-xs text-slate-400">
                  Unit {pendingBill.unitNumber} ({currentUser.tower})
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {pendingBill.month} {pendingBill.year} Maintenance Due
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-md">
                Includes building maintenance, common area power, 24/7 security guard patrol, elevator AMC, and sinking fund.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-right w-full md:w-auto shrink-0 flex flex-col items-start md:items-end justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Amount Payable</span>
                <div className="text-3xl font-extrabold text-white mt-0.5">
                  ₹{pendingBill.amount.toFixed(2)}
                </div>
              </div>

              <button
                onClick={() => setSelectedBillForPayment(pendingBill)}
                className="mt-4 w-full md:w-auto px-6 py-2.5 rounded-xl bg-teal-500/100 hover:bg-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay Due Online
              </button>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-slate-500 block text-[11px]">Society Care</span>
              <span className="font-bold text-white text-sm">₹{pendingBill.breakdown.maintenanceCharge}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-slate-500 block text-[11px]">Sinking Fund</span>
              <span className="font-bold text-white text-sm">₹{pendingBill.breakdown.sinkingFund}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-slate-500 block text-[11px]">Water AMC</span>
              <span className="font-bold text-white text-sm">₹{pendingBill.breakdown.waterCharge}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-slate-500 block text-[11px]">Parking Slot</span>
              <span className="font-bold text-white text-sm">₹{pendingBill.breakdown.parkingCharge}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-slate-500 block text-[11px]">24/7 Security</span>
              <span className="font-bold text-white text-sm">₹{pendingBill.breakdown.securityCharge}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-slate-500 block text-[11px]">GST / Taxes</span>
              <span className="font-bold text-white text-sm">₹{pendingBill.breakdown.tax}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-teal-500/10 rounded-2xl p-6 border border-teal-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1121] dark:text-teal-900">All Maintenance Bills Paid!</h3>
              <p className="text-xs text-teal-400">No overdue payments or pending society dues for Unit {currentUser.unitNumber}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History & Invoices Table */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-400" />
              Maintenance Invoices & Payment Ledger
            </h3>
            <p className="text-xs text-slate-500">Official verified receipts for society records and auditing</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1121]/80 border-b border-[#1F2937] text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3">Billing Period</th>
                <th className="px-6 py-3">Unit #</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Payment Status</th>
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-[#0B1121]/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">
                    {bill.month} {bill.year}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-400">
                    {bill.unitNumber}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    ₹{bill.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {bill.dueDate}
                  </td>
                  <td className="px-6 py-4">
                    {bill.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Paid on {bill.paidDate}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending Payment
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">
                    {bill.transactionId || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {bill.status === 'PAID' ? (
                      <button
                        onClick={() => setPaymentSuccessReceipt(bill)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg border border-teal-500/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        View Receipt
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedBillForPayment(bill)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Bill Modal */}
      {selectedBillForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1121]/80 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Online Maintenance Payment</h3>
                <p className="text-xs text-slate-500">{selectedBillForPayment.month} {selectedBillForPayment.year} • Unit {selectedBillForPayment.unitNumber}</p>
              </div>
              <button
                onClick={() => setSelectedBillForPayment(null)}
                className="w-7 h-7 rounded text-slate-400 hover:text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0B1121] p-4 rounded-xl border border-[#1F2937] mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Invoice Bill Amount</span>
                <span className="font-bold text-white text-base">₹{selectedBillForPayment.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Convenience Fee</span>
                <span className="text-teal-400 font-bold">₹0.00 (Waived)</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Payment Mode
              </label>

              {[
                { id: 'UPI', label: 'Instant UPI / QR Code', desc: 'Google Pay, Apple Pay, PhonePe' },
                { id: 'CARD', label: 'Credit or Debit Card', desc: 'Visa, Mastercard, Amex' },
                { id: 'NETBANKING', label: 'Net Banking & Auto-Debit', desc: 'Direct Society Escrow Bank Transfer' },
              ].map((method) => (
                <label
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'bg-teal-500/10 border-teal-500/50 ring-2 ring-teal-500/20'
                      : 'bg-[#111827] border-[#1F2937] hover:bg-[#0B1121]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">{method.label}</p>
                    <p className="text-[10px] text-slate-500">{method.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPaymentMethod === method.id ? 'border-teal-500/50 bg-gradient-to-r from-teal-600 to-cyan-600' : 'border-[#374151]'
                  }`}>
                    {selectedPaymentMethod === method.id && <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setSelectedBillForPayment(null)}
                className="px-4 py-2 rounded-xl bg-[#1F2937] text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                disabled={isProcessingPayment}
                className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-900/20 flex items-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Escrow...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Pay ₹{selectedBillForPayment.amount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {paymentSuccessReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1121]/80 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#1F2937] animate-in zoom-in-95 duration-100">
            <div className="text-center pb-4 border-b border-[#1F2937]">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Official Payment Receipt</h3>
              <p className="text-xs text-slate-500 font-mono">Oakwood Heights Apartment Owners Association</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-300 border-b border-[#1F2937]">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-white">{paymentSuccessReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit / Flat:</span>
                <span className="font-bold text-white">{paymentSuccessReceipt.unitNumber} ({paymentSuccessReceipt.residentName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Period:</span>
                <span className="font-bold">{paymentSuccessReceipt.month} {paymentSuccessReceipt.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span>{paymentSuccessReceipt.paidDate || 'Today'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode of Payment:</span>
                <span className="font-semibold text-teal-400">{paymentSuccessReceipt.paymentMethod || 'Online'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#1F2937] text-sm font-bold text-white">
                <span>Total Amount Paid:</span>
                <span className="text-teal-400">₹{paymentSuccessReceipt.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-[11px] text-teal-400 font-semibold bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                Status: Settled in Society Account
              </span>
              <button
                onClick={() => setPaymentSuccessReceipt(null)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
