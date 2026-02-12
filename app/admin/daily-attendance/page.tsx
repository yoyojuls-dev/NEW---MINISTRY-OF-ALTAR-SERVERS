/* app/admin/daily-attendance/page.tsx */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  surname: string;
  givenName: string;
  memberStatus: string;
}

interface Assignment {
  day: string;
  time: 'AM' | 'PM';
  memberId: string;
  month: number;
  year: number;
}

interface AttendanceRecord {
  assignmentId: string;
  attended: boolean;
  date: string;
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['AM', 'PM'] as const;

// Helper function to format name as "Surname, I."
const formatMemberName = (surname: string, givenName: string) => {
  const initials = givenName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('.');
  return `${surname}, ${initials}.`;
};

// Generate assignment ID
const getAssignmentId = (day: string, time: string, month: number, year: number) => {
  return `${day}-${time}-${month}-${year}`;
};

export default function DailyAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'compilation' | 'assignment' | 'attendance'>('compilation');
  
  // Assignment state
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<'AM' | 'PM'>('AM');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [selectedAttendanceDay, setSelectedAttendanceDay] = useState<string>('');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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

  const handleAssignMember = () => {
    if (!selectedDay || !selectedTime || !selectedMemberId) {
      toast.error('Please select day, time, and member');
      return;
    }

    const assignmentId = getAssignmentId(selectedDay, selectedTime, selectedMonth, selectedYear);
    
    const assignment: Assignment = {
      day: selectedDay,
      time: selectedTime,
      memberId: selectedMemberId,
      month: selectedMonth,
      year: selectedYear,
    };

    setAssignments(prev => ({
      ...prev,
      [assignmentId]: assignment,
    }));

    setSelectedMemberId('');
    toast.success('Member assigned successfully!');
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[assignmentId];
      return newAssignments;
    });
    toast.success('Assignment removed');
  };

  const handleAttendanceToggle = (assignmentId: string, date: string) => {
    setAttendanceRecords(prev => {
      const current = prev[assignmentId];
      return {
        ...prev,
        [assignmentId]: {
          assignmentId,
          attended: !current?.attended,
          date,
        }
      };
    });
  };

  const getAssignmentsForDay = (day: string) => {
    return Object.entries(assignments).filter(([id, assignment]) => 
      assignment.day === day && 
      assignment.month === selectedMonth && 
      assignment.year === selectedYear
    );
  };

  const getAllAssignmentsForMonth = () => {
    return Object.entries(assignments).filter(([id, assignment]) => 
      assignment.month === selectedMonth && 
      assignment.year === selectedYear
    );
  };

  const handleBackClick = () => {
    router.push('/admin');
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
            {/* Compilation Tab */}
            <button
              onClick={() => setActiveTab('compilation')}
              style={{
                background: activeTab === 'compilation' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : 'white',
                borderColor: activeTab === 'compilation' ? 'transparent' : '#4169E1'
              }}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'compilation'
                  ? 'shadow-md'
                  : 'border-2'
              }`}
              title="Compilation"
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'compilation' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            {/* Assignment Tab */}
            <button
              onClick={() => setActiveTab('assignment')}
              style={{
                background: activeTab === 'assignment' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : 'white',
                borderColor: activeTab === 'assignment' ? 'transparent' : '#4169E1'
              }}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'assignment'
                  ? 'shadow-md'
                  : 'border-2'
              }`}
              title="Assignment"
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'assignment' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>

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
              title="Attendance"
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
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">DAILY MASS ATTENDANCE {selectedYear}</h2>

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
        </div>

        {/* Compilation Tab Content */}
        {activeTab === 'compilation' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Schedule Overview</h3>
            
            {getAllAssignmentsForMonth().length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-lg">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 mb-4">No assignments for {MONTHS[selectedMonth]}</p>
                <button
                  onClick={() => setActiveTab('assignment')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start assigning members
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {WEEKDAYS.map((day) => {
                  const dayAssignments = getAssignmentsForDay(day);
                  if (dayAssignments.length === 0) return null;

                  return (
                    <div key={day} className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                      <div 
                        className="px-6 py-3"
                        style={{
                          background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                        }}
                      >
                        <h4 className="font-bold text-white">{day}</h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {dayAssignments.map(([assignmentId, assignment]) => {
                          const member = members.find(m => m.id === assignment.memberId);
                          const attendanceRecord = attendanceRecords[assignmentId];
                          
                          return (
                            <div key={assignmentId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  assignment.time === 'AM' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {assignment.time}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {member ? formatMemberName(member.surname, member.givenName) : 'Unknown'}
                                </span>
                              </div>
                              {attendanceRecord?.attended && (
                                <span className="text-green-600">
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignment Tab Content */}
        {activeTab === 'assignment' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Member to Daily Mass</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Day</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a day...</option>
                    {WEEKDAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Time</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TIMES.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        style={{
                          background: selectedTime === time 
                            ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                            : 'white'
                        }}
                        className={`py-3 rounded-lg font-semibold border-2 transition-all ${
                          selectedTime === time 
                            ? 'text-white border-transparent' 
                            : 'text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Member</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a member...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {formatMemberName(member.surname, member.givenName)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssignMember}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                  className="w-full py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Assign Member
                </button>
              </div>
            </div>

            {/* Current Assignments */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Current Assignments for {MONTHS[selectedMonth]}</h3>
              
              <div className="space-y-3">
                {WEEKDAYS.map(day => {
                  const dayAssignments = getAssignmentsForDay(day);
                  
                  return (
                    <div key={day} className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">{day}</h4>
                          <span className="text-sm text-gray-600">
                            {dayAssignments.length} {dayAssignments.length === 1 ? 'assignment' : 'assignments'}
                          </span>
                        </div>
                      </div>
                      
                      {dayAssignments.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No assignments yet
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {TIMES.map(time => {
                            const assignment = dayAssignments.find(([id, a]) => a.time === time);
                            if (!assignment) return null;
                            
                            const [assignmentId, assignmentData] = assignment;
                            const member = members.find(m => m.id === assignmentData.memberId);
                            
                            return (
                              <div key={time} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    time === 'AM' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {time}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {member ? formatMemberName(member.surname, member.givenName) : 'Unknown'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveAssignment(assignmentId)}
                                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab Content */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mark Attendance</h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Day to Mark Attendance</label>
              <select
                value={selectedAttendanceDay}
                onChange={(e) => setSelectedAttendanceDay(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a day...</option>
                {WEEKDAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {selectedAttendanceDay && (
              <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                <div 
                  className="px-6 py-4"
                  style={{
                    background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                >
                  <h4 className="font-bold text-white">{selectedAttendanceDay} - {MONTHS[selectedMonth]} {selectedYear}</h4>
                </div>
                
                {getAssignmentsForDay(selectedAttendanceDay).length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No assignments for this day
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {getAssignmentsForDay(selectedAttendanceDay).map(([assignmentId, assignment]) => {
                      const member = members.find(m => m.id === assignment.memberId);
                      const attended = attendanceRecords[assignmentId]?.attended || false;
                      
                      return (
                        <div key={assignmentId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              assignment.time === 'AM' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {assignment.time}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member ? formatMemberName(member.surname, member.givenName) : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">{selectedAttendanceDay} {assignment.time}</p>
                            </div>
                          </div>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attended}
                              onChange={() => handleAttendanceToggle(assignmentId, new Date().toISOString())}
                              className="w-6 h-6 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {attended ? 'Present' : 'Absent'}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
    </div>
  );
}