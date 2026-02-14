// app/member/schedule/page.tsx - Monthly Expenses and Dues Tracker for Members
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Expense {
  id: string;
  expendedOn: string;
  amount: number;
  date: string;
  spentBy: string;
  month: number;
  year: number;
}

interface MemberDuesRecord {
  memberId: string;
  memberName: string;
  monthlyDues: {
    month: number;
    year: number;
    amountPaid: number;
    datePaid?: string;
  }[];
  totalPaid: number;
  totalDue: number;
  status: 'FULLY_PAID' | 'HAS_DUES' | 'PAID_ADVANCE';
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const MONTHLY_DUE_AMOUNT = 20;

export default function MemberSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberDues, setMemberDues] = useState<MemberDuesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'dues'>('expenses');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchExpenses();
      fetchMemberDues();
    } else if (status === 'unauthenticated') {
      router.push('/member/login');
    }
  }, [status, selectedMonth, selectedYear, router]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/member/expenses?month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (err: any) {
      console.error('Error loading expenses:', err);
      setError(err.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDues = async () => {
    try {
      const response = await fetch('/api/member/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch member dues');
      }

      const memberData = await response.json();
      
      // For now, we'll create a simple dues record
      // In a real scenario, this would come from an API endpoint
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const duesRecord: MemberDuesRecord = {
        memberId: memberData.id,
        memberName: memberData.fullName,
        monthlyDues: [
          {
            month: currentMonth,
            year: currentYear,
            amountPaid: 0,
            datePaid: undefined
          }
        ],
        totalPaid: 0,
        totalDue: MONTHLY_DUE_AMOUNT,
        status: 'HAS_DUES'
      };

      setMemberDues(duesRecord);
    } catch (err: any) {
      console.error('Error loading member dues:', err);
      setMemberDues(null);
    }
  };

  const handleBackClick = () => {
    router.push('/member/dashboard');
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getDuesStatusColor = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PAID_ADVANCE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'HAS_DUES':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDuesStatusText = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'Fully Paid';
      case 'PAID_ADVANCE':
        return 'Advance Payment';
      case 'HAS_DUES':
        return 'Has Dues';
      default:
        return 'Unknown';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
      }}
    >
      {/* Blue Header with Back Button and Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative w-16 h-16">
            <Image
              src="/images/MAS LOGO.png"
              alt="MAS Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* White Content Card */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        {/* Tab Navigation */}
        <div className="flex items-center space-x-3 mb-6">
          {/* Expenses Tab */}
          <button
            onClick={() => setActiveTab('expenses')}
            style={{
              background: activeTab === 'expenses' 
                ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                : 'white',
              borderColor: activeTab === 'expenses' ? 'transparent' : '#4169E1'
            }}
            className={`p-3 rounded-xl transition-all ${
              activeTab === 'expenses'
                ? 'shadow-md'
                : 'border-2'
            }`}
          >
            <svg 
              className={`w-6 h-6 ${activeTab === 'expenses' ? 'text-white' : 'text-blue-700'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          {/* Dues Tab */}
          <button
            onClick={() => setActiveTab('dues')}
            style={{
              background: activeTab === 'dues' 
                ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                : 'white',
              borderColor: activeTab === 'dues' ? 'transparent' : '#4169E1'
            }}
            className={`p-3 rounded-xl transition-all ${
              activeTab === 'dues'
                ? 'shadow-md'
                : 'border-2'
            }`}
          >
            <svg 
              className={`w-6 h-6 ${activeTab === 'dues' ? 'text-white' : 'text-blue-700'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">MONTHLY TRACKER</h2>

        {/* Month Selector */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                style={{
                  background: selectedMonth === index 
                    ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                    : '#f3f4f6'
                }}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all shadow-sm ${
                  selectedMonth === index
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Viewing {MONTHS[selectedMonth]} {selectedYear}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Expenses Summary Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Expenses</h3>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Expenses</span>
                  <span className="text-3xl font-bold text-orange-600">₱{getTotalExpenses().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-700 uppercase">
                  <div>Expended On</div>
                  <div className="text-right">Amount</div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500">No expenses recorded for {MONTHS[selectedMonth]}</p>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="grid grid-cols-2 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {expense.expendedOn}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-orange-600">
                          ₱{expense.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dues Tab */}
        {activeTab === 'dues' && (
          <div className="space-y-4">
            {memberDues && (
              <>
                {/* Dues Summary Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Your Dues Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-semibold text-gray-700">Total Paid</span>
                      <span className="text-3xl font-bold text-blue-600">₱{memberDues.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <span className="font-semibold text-gray-700">Total Due</span>
                      <span className="text-3xl font-bold text-red-600">₱{memberDues.totalDue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="font-semibold text-gray-700">Balance</span>
                      <span className={`text-3xl font-bold ${
                        memberDues.totalPaid >= memberDues.totalDue
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {memberDues.totalPaid >= memberDues.totalDue
                          ? `+₱${(memberDues.totalPaid - memberDues.totalDue).toFixed(2)}`
                          : `-₱${(memberDues.totalDue - memberDues.totalPaid).toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Status</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getDuesStatusColor(memberDues.status)}`}>
                      {getDuesStatusText(memberDues.status)}
                    </span>
                  </div>
                </div>

                {/* Monthly Dues History */}
                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {memberDues.monthlyDues && memberDues.monthlyDues.length > 0 ? (
                      memberDues.monthlyDues.map((due, index) => (
                        <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {MONTHS[due.month]} {due.year}
                              </p>
                              {due.datePaid && (
                                <p className="text-sm text-gray-500">
                                  Paid on {new Date(due.datePaid).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">
                                ₱{due.amountPaid.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <p className="text-gray-500">No payment history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 rounded-[30px] p-4 shadow-2xl z-50"
        style={{
          background: '#000080',
          transform: 'translateX(-50%)'
        }}
      >
        <div className="flex justify-center space-x-8 px-4">
          <button
            onClick={() => router.push('/member/dashboard')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => router.push('/member/schedule')}
            className="flex flex-col items-center text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Schedule</span>
          </button>
          <button
            onClick={() => router.push('/member/birthdays')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">Birthdays</span>
          </button>
        </div>
      </div>
    </div>
  );
}
