/* app/admin/monthly-meeting/page.tsx */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  surname: string;
  givenName: string;
  memberStatus: string;
}

interface MonthlyAttendance {
  memberId: string;
  present: boolean;
  absent: boolean;
  excused: boolean;
  excuseLetter: string;
  dueChecked: boolean;
  dueAmount: number;
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

interface Expense {
  id: string;
  expendedOn: string;
  amount: number;
  date: string;
  spentBy: string;
  month: number;
  year: number;
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const MONTHLY_DUE_AMOUNT = 20; // ₱20 per month

// Helper function to format name as "Surname, I."
const formatMemberName = (surname: string, givenName: string) => {
  const initials = givenName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('.');
  return `${surname}, ${initials}.`;
};

export default function MonthlyMeetingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, MonthlyAttendance>>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'expenses' | 'financial'>('attendance');
  const [showDateTimeEditor, setShowDateTimeEditor] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('12:00');
  const [meetingDay, setMeetingDay] = useState(1);
  const [memberDuesRecords, setMemberDuesRecords] = useState<MemberDuesRecord[]>([]);
  const [selectedMemberDues, setSelectedMemberDues] = useState<MemberDuesRecord | null>(null);
  const [showDuesSummaryModal, setShowDuesSummaryModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseFormData, setExpenseFormData] = useState({
    expendedOn: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    spentBy: '',
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  // Calculate first Sunday of the selected month
  const calculateFirstSunday = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    return 1 + daysUntilSunday;
  };

  // Initialize meeting date when month/year changes
  useEffect(() => {
    const firstSundayDay = calculateFirstSunday(selectedYear, selectedMonth);
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(firstSundayDay).padStart(2, '0')}`;
    
    setMeetingDate(formattedDate);
    setMeetingDay(firstSundayDay);
    setMeetingTime('12:00');
  }, [selectedMonth, selectedYear]);

  // Update meeting day when date changes
  useEffect(() => {
    if (meetingDate) {
      const date = new Date(meetingDate);
      setMeetingDay(date.getDate());
    }
  }, [meetingDate]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.userType !== 'ADMIN') {
        router.push('/member/dashboard');
        return;
      }
      fetchMembers();
    } else if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (members.length > 0) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, members]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members?status=ACTIVE');
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance/monthly?month=${selectedMonth}&year=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      
      const data = await response.json();
      
      const initialAttendance: Record<string, MonthlyAttendance> = {};
      members.forEach(member => {
        const existingData = data.find((a: any) => a.memberId === member.id);
        
        initialAttendance[member.id] = existingData || {
          memberId: member.id,
          present: false,
          absent: false,
          excused: false,
          excuseLetter: '',
          dueChecked: false,
          dueAmount: 0,
        };
      });
      
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      
      const initialAttendance: Record<string, MonthlyAttendance> = {};
      members.forEach(member => {
        initialAttendance[member.id] = {
          memberId: member.id,
          present: false,
          absent: false,
          excused: false,
          excuseLetter: '',
          dueChecked: false,
          dueAmount: 0,
        };
      });
      
      setAttendance(initialAttendance);
    }
  };

  useEffect(() => {
    if (members.length > 0) {
      fetchMemberDuesRecords();
    }
  }, [members, selectedYear]);
  const fetchMemberDuesRecords = async () => {
    try {
      const res = await fetch(`/api/financial/dues?year=${selectedYear}`);
      if (!res.ok) throw new Error('Failed to fetch dues');
      const body = await res.json();
      const results: any[] = body.results || [];

      const duesRecords: MemberDuesRecord[] = members.map((member) => {
        const memberPayments = results.find(r => r.memberId === member.id)?.payments || [];

        // prepare monthly dues for the year
        const monthlyDues = Array.from({ length: 12 }).map((_, i) => {
          const paymentsInMonth = memberPayments.filter((p: any) => {
            const d = new Date(p.date);
            return d.getFullYear() === selectedYear && d.getMonth() === i;
          });
          const amountPaid = paymentsInMonth.reduce((s: number, p: any) => s + (p.amount || 0), 0);
          const datePaid = paymentsInMonth.length ? paymentsInMonth[0].date : undefined;
          return { month: i, year: selectedYear, amountPaid, datePaid };
        });

        const totalPaid = monthlyDues.reduce((s, m) => s + (m.amountPaid || 0), 0);
        const monthsElapsed = currentMonth + 1;
        const totalDue = monthsElapsed * MONTHLY_DUE_AMOUNT;

        let status: 'FULLY_PAID' | 'HAS_DUES' | 'PAID_ADVANCE' = 'HAS_DUES';
        if (totalPaid >= totalDue) {
          status = totalPaid > totalDue ? 'PAID_ADVANCE' : 'FULLY_PAID';
        }

        return {
          memberId: member.id,
          memberName: formatMemberName(member.surname, member.givenName),
          monthlyDues,
          totalPaid,
          totalDue,
          status,
        };
      });

      setMemberDuesRecords(duesRecords);
    } catch (err) {
      console.error('Error fetching member dues records:', err);
      // fallback to generated sample if API fails
      const duesRecords: MemberDuesRecord[] = members.map((member) => {
        const monthlyDues = [];
        let totalPaid = 0;
        for (let i = 0; i < 12; i++) {
          const amountPaid = 0;
          monthlyDues.push({ month: i, year: selectedYear, amountPaid, datePaid: undefined });
        }
        const monthsElapsed = currentMonth + 1;
        const totalDue = monthsElapsed * MONTHLY_DUE_AMOUNT;
        return {
          memberId: member.id,
          memberName: formatMemberName(member.surname, member.givenName),
          monthlyDues,
          totalPaid,
          totalDue,
          status: 'HAS_DUES',
        };
      });
      setMemberDuesRecords(duesRecords);
    }
  };

  const handleMemberDuesClick = (duesRecord: MemberDuesRecord) => {
    setSelectedMemberDues(duesRecord);
    setShowDuesSummaryModal(true);
  };

  const getDuesStatusColor = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'HAS_DUES':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PAID_ADVANCE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDuesStatusText = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'Fully Paid';
      case 'HAS_DUES':
        return 'Has Dues';
      case 'PAID_ADVANCE':
        return 'Paid in Advance';
      default:
        return 'Unknown';
    }
  };

  // useEffect(() => {
  //   loadExpenses();
  // }, [selectedMonth, selectedYear]);

  // const loadExpenses = async () => {
  //   // Sample expenses - replace with actual API call
  //   const sampleExpenses: Expense[] = [
  //     {
  //       id: '1',
  //       expendedOn: 'Church Supplies',
  //       amount: 500,
  //       date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-05`,
  //       spentBy: 'John Doe',
  //       month: selectedMonth,
  //       year: selectedYear,
  //     },
  //     {
  //       id: '2',
  //       expendedOn: 'Training Materials',
  //       amount: 300,
  //       date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-12`,
  //       spentBy: 'Jane Smith',
  //       month: selectedMonth,
  //       year: selectedYear,
  //     },
  //   ];
  //   setExpenses(sampleExpenses);
  // };

  const handleAddExpense = () => {
    if (!expenseFormData.expendedOn || !expenseFormData.amount || !expenseFormData.date || !expenseFormData.spentBy) {
      toast.error('Please fill in all fields');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      expendedOn: expenseFormData.expendedOn,
      amount: parseFloat(expenseFormData.amount),
      date: expenseFormData.date,
      spentBy: expenseFormData.spentBy,
      month: selectedMonth,
      year: selectedYear,
    };

    setExpenses([...expenses, newExpense]);
    setShowAddExpenseModal(false);
    setExpenseFormData({
      expendedOn: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      spentBy: '',
    });
    toast.success('Expense added successfully!');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast.success('Expense deleted');
  };

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseDetailModal(true);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const handlePresentChange = (memberId: string) => {
    if (!isCurrentMonth) return;

    setAttendance(prev => {
      const prevState = prev[memberId] || {};
      const newPresent = !prevState.present;
      return {
        ...prev,
        [memberId]: {
          ...prevState,
          present: newPresent,
          // if setting present true, clear other statuses to enforce exclusivity
          absent: newPresent ? false : prevState.absent,
          excused: newPresent ? false : prevState.excused,
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleAbsentChange = (memberId: string) => {
    if (!isCurrentMonth) return;

    setAttendance(prev => {
      const prevState = prev[memberId] || {};
      const newAbsent = !prevState.absent;
      return {
        ...prev,
        [memberId]: {
          ...prevState,
          absent: newAbsent,
          // if setting absent true, clear other statuses
          present: newAbsent ? false : prevState.present,
          excused: newAbsent ? false : prevState.excused,
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleExcusedChange = (memberId: string) => {
    if (!isCurrentMonth) return;

    setAttendance(prev => {
      const prevState = prev[memberId] || {};
      const newExcused = !prevState.excused;
      return {
        ...prev,
        [memberId]: {
          ...prevState,
          excused: newExcused,
          // if setting excused true, clear other statuses
          present: newExcused ? false : prevState.present,
          absent: newExcused ? false : prevState.absent,
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleDueChange = (memberId: string) => {
    if (!isCurrentMonth) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        dueChecked: !prev[memberId]?.dueChecked,
        dueAmount: !prev[memberId]?.dueChecked ? 20 : 0,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleDueAmountChange = (memberId: string, amount: string) => {
    if (!isCurrentMonth) return;
    
    const numAmount = parseFloat(amount) || 0;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        dueAmount: numAmount,
        dueChecked: numAmount >= 20 ? true : prev[memberId]?.dueChecked,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const openExcuseModal = (memberId: string) => {
    setSelectedMember(memberId);
    setExcuseText(attendance[memberId]?.excuseLetter || '');
    setShowExcuseModal(true);
  };

  const saveExcuseLetter = () => {
    if (selectedMember) {
      setAttendance(prev => ({
        ...prev,
        [selectedMember]: {
          ...prev[selectedMember],
          excuseLetter: excuseText,
        }
      }));
      setHasUnsavedChanges(true);
    }
    setShowExcuseModal(false);
    setSelectedMember(null);
    setExcuseText('');
  };

  const handleSaveAttendance = async () => {
    try {
      const response = await fetch('/api/attendance/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          attendance: Object.values(attendance),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }
      
      toast.success('Attendance saved successfully!');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    }
  };

  const handleSaveMeetingDateTime = () => {
    const date = new Date(meetingDate);
    const day = date.getDate();
    setMeetingDay(day);
    toast.success(`Meeting set for ${MONTHS[selectedMonth]} ${day} at ${meetingTime}`);
    setShowDateTimeEditor(false);
  };

  const handleBackClick = () => {
    router.push('/admin');
  };

  const getTotals = () => {
    const attendanceValues = Object.values(attendance);
    return {
      present: attendanceValues.filter(a => a.present).length,
      absent: attendanceValues.filter(a => a.absent).length,
      excused: attendanceValues.filter(a => a.excused).length,
      duesPaid: attendanceValues.filter(a => a.dueChecked).length,
      totalAmount: attendanceValues.reduce((sum, a) => sum + (a.dueAmount || 0), 0),
    };
  };

  if (isLoading) {
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

  const totals = getTotals();

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
        {/* Header with Tab Icons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Attendance Tab */}
            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                background: activeTab === 'attendance' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : 'white',
                borderColor: activeTab === 'attendance' ? 'transparent' : '#4169E1'
              }}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'attendance'
                  ? 'shadow-md'
                  : 'border-2'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'attendance' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
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
            
            {/* Financial Tab */}
            <button
              onClick={() => setActiveTab('financial')}
              style={{
                background: activeTab === 'financial' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : 'white',
                borderColor: activeTab === 'financial' ? 'transparent' : '#4169E1'
              }}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'financial'
                  ? 'shadow-md'
                  : 'border-2'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'financial' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          {/* Set Monthly Meeting Button */}
          <button
            onClick={() => setShowDateTimeEditor(true)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="font-medium">Set Meeting</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Attendance Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ATTENDANCE {selectedYear}</h2>

        {/* Month Selector with Date */}
        <div className="mb-4">
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
          
          {/* Display Meeting Date */}
          <div className="mt-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {MONTHS[selectedMonth]} {meetingDay}
            </p>
            <p className="text-sm text-gray-600">
              Meeting Time: {meetingTime}
            </p>
          </div>
        </div>

        {/* Notice */}
        {isCurrentMonth && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-lg">
            <p className="text-xs text-red-500 font-semibold leading-tight">
              *ONLY CHECK DUE IF MEMBER PAYS FULLY<br/>
              OTHERWISE, PUT THE AMOUNT
            </p>
          </div>
        )}

        {!isCurrentMonth && (
          <div className="bg-gray-50 border-l-4 border-gray-400 p-3 mb-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Viewing {MONTHS[selectedMonth]} {selectedYear}. Only current month can be edited.
            </p>
          </div>
        )}

        {/* Attendance Table */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm border-2 border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Name</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Present</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Absent</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Excused</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Due</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatMemberName(member.surname, member.givenName)}
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendance[member.id]?.present || false}
                            onChange={() => handlePresentChange(member.id)}
                            disabled={!isCurrentMonth}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="text-center py-4 px-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendance[member.id]?.absent || false}
                            onChange={() => handleAbsentChange(member.id)}
                            disabled={!isCurrentMonth}
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="text-center py-4 px-2">
                        <div className="flex items-center justify-center space-x-2">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attendance[member.id]?.excused || false}
                              onChange={() => handleExcusedChange(member.id)}
                              disabled={!isCurrentMonth}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            />
                          </label>
                          {attendance[member.id]?.excused && (
                            <button
                              onClick={() => openExcuseModal(member.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"
                              title="View/Edit Excuse Letter"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendance[member.id]?.dueChecked || false}
                            onChange={() => handleDueChange(member.id)}
                            disabled={!isCurrentMonth}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="text-center py-4 px-4">
                        <input
                          type="number"
                          value={attendance[member.id]?.dueAmount || ''}
                          onChange={(e) => handleDueAmountChange(member.id, e.target.value)}
                          disabled={!isCurrentMonth}
                          placeholder="0"
                          className="w-24 px-3 py-2 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                          min="0"
                          step="1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 uppercase">Total</td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        {totals.present}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                        {totals.absent}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {totals.excused}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                        {totals.duesPaid}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        ₱{totals.totalAmount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Tab Content */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Expenses Summary Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Monthly Expenses</h3>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Expense</span>
                </button>
              </div>
              
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
                  <div className="text-right">Spent</div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No expenses recorded for {MONTHS[selectedMonth]}</p>
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first expense
                    </button>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <button
                      key={expense.id}
                      onClick={() => handleExpenseClick(expense)}
                      className="w-full grid grid-cols-2 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center text-left"
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {expense.expendedOn}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-orange-600">
                          ₱{expense.amount.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab Content - Dues List */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            {/* Financial Summary Cards - Matching Mobile Design */}
            <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="font-semibold text-gray-700">Members Paid Dues</span>
                  <span className="text-3xl font-bold text-purple-600">{totals.duesPaid}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-semibold text-gray-700">Total Amount Collected</span>
                  <span className="text-3xl font-bold text-green-600">₱{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Dues Status List */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Member Dues Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Click on a member to view detailed payment history
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {memberDuesRecords.map((record) => (
                  <button
                    key={record.memberId}
                    onClick={() => handleMemberDuesClick(record)}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {record.memberName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Paid: ₱{record.totalPaid.toFixed(2)} / Due: ₱{record.totalDue.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right mr-4">
                          <p className="text-sm font-bold text-gray-900">
                            {record.totalPaid >= record.totalDue ? (
                              <span className="text-green-600">
                                +₱{(record.totalPaid - record.totalDue).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-red-600">
                                -₱{(record.totalDue - record.totalPaid).toFixed(2)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">Balance</p>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDuesStatusColor(record.status)}`}>
                          {getDuesStatusText(record.status)}
                        </span>
                        
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isCurrentMonth && hasUnsavedChanges && (
          <div className="mb-6">
            <button
              onClick={handleSaveAttendance}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
              className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:shadow-xl"
            >
              SAVE CHANGES
            </button>
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
            onClick={() => router.push('/admin')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => router.push('/admin/messages')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Messages</span>
          </button>
          <button
            onClick={() => router.push('/admin/birthdays')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">Birthdays</span>
          </button>
        </div>
      </div>

      {/* Meeting Date & Time Editor Modal */}
      {showDateTimeEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div 
              className="text-white p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Set Monthly Meeting</h3>
                <button
                  onClick={() => setShowDateTimeEditor(false)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-2">
                {MONTHS[selectedMonth]} {selectedYear}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: First Sunday of the month</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Time
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 12:00 PM (Noon)</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDateTimeEditor(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMeetingDateTime}
                  style={{
                    background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excuse Letter Modal */}
      {showExcuseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div 
              className="text-white p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Excuse Letter</span>
                </h3>
                <button
                  onClick={() => setShowExcuseModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedMember && (
                <p className="text-blue-100 mt-2">
                  {(() => {
                    const member = members.find(m => m.id === selectedMember);
                    return member ? formatMemberName(member.surname, member.givenName) : '';
                  })()}
                </p>
              )}
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Excuse Letter Details
              </label>
              <textarea
                value={excuseText}
                onChange={(e) => setExcuseText(e.target.value)}
                placeholder="Enter excuse letter details here..."
                className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                disabled={!isCurrentMonth}
              />
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowExcuseModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                {isCurrentMonth && (
                  <button
                    onClick={saveExcuseLetter}
                    style={{
                      background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                    }}
                    className="flex-1 px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Save Letter</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dues Summary Modal */}
      {showDuesSummaryModal && selectedMemberDues && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-2">
              <div 
                className="text-white p-4 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Dues Summary</span>
                  </h3>
                  <p className="text-blue-100 mt-1 text-sm">{selectedMemberDues.memberName}</p>
                </div>
                <button
                  onClick={() => setShowDuesSummaryModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                  <p className="text-xl font-bold text-blue-600">₱{selectedMemberDues.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Due</p>
                  <p className="text-xl font-bold text-orange-600">₱{selectedMemberDues.totalDue.toFixed(2)}</p>
                </div>
                <div className={`border-2 rounded-lg p-3 text-center ${
                  selectedMemberDues.totalPaid >= selectedMemberDues.totalDue
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">Balance</p>
                  <p className={`text-xl font-bold ${
                    selectedMemberDues.totalPaid >= selectedMemberDues.totalDue
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {selectedMemberDues.totalPaid >= selectedMemberDues.totalDue ? '+' : '-'}
                    ₱{Math.abs(selectedMemberDues.totalPaid - selectedMemberDues.totalDue).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4 flex justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDuesStatusColor(selectedMemberDues.status)}`}>
                  {getDuesStatusText(selectedMemberDues.status)}
                </span>
              </div>

              {/* Monthly Payment History */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-3">Monthly Payment History ({selectedYear})</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedMemberDues.monthlyDues.map((monthData, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        monthData.amountPaid > 0
                          ? 'bg-green-50 border-green-200'
                          : index <= currentMonth
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          monthData.amountPaid > 0
                            ? 'bg-green-200'
                            : index <= currentMonth
                            ? 'bg-red-200'
                            : 'bg-gray-200'
                        }`}>
                          {monthData.amountPaid > 0 ? (
                            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : index <= currentMonth ? (
                            <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{MONTHS[monthData.month]}</p>
                          {monthData.datePaid && (
                            <p className="text-xs text-gray-500">
                              Paid on {new Date(monthData.datePaid).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold ${
                          monthData.amountPaid > 0
                            ? 'text-green-700'
                            : index <= currentMonth
                            ? 'text-red-700'
                            : 'text-gray-500'
                        }`}>
                          ₱{monthData.amountPaid.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {monthData.amountPaid > 0 ? 'Paid' : index <= currentMonth ? 'Unpaid' : 'Upcoming'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowDuesSummaryModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                  className="w-full px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {showExpenseDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div 
              className="text-white p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Expense Details</span>
                </h3>
                <button
                  onClick={() => setShowExpenseDetailModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Expense Amount Card */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Amount Spent</p>
                <p className="text-4xl font-bold text-orange-600">₱{selectedExpense.amount.toFixed(2)}</p>
              </div>

              {/* Expense Details Grid */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Expended On</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedExpense.expendedOn}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedExpense.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Spent By</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedExpense.spentBy}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowExpenseDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteExpense(selectedExpense.id);
                    setShowExpenseDetailModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div 
              className="text-white p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Add Expense</span>
                </h3>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-2 text-sm">
                {MONTHS[selectedMonth]} {selectedYear}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What was it spent on? *
                </label>
                <input
                  type="text"
                  value={expenseFormData.expendedOn}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, expendedOn: e.target.value })}
                  placeholder="e.g., Church supplies, Training materials"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How much? (₱) *
                </label>
                <input
                  type="number"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  When? *
                </label>
                <input
                  type="date"
                  value={expenseFormData.date}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Who spent? *
                </label>
                <input
                  type="text"
                  value={expenseFormData.spentBy}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, spentBy: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  style={{
                    background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}