// app/member/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  message: string;
  type: 'update' | 'change' | 'reminder';
  timestamp: Date;
  isRead: boolean;
}

interface DutyDay {
  day: number;
  duties: string[];
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  hasDuty: boolean;
  duties: string[];
}

interface MemberProfile {
  id: string;
  fullName: string;
  surname: string;
  givenName: string;
  email: string;
  memberStatus: string;
  serverLevel: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [memberGroup, setMemberGroup] = useState<string>("Loading...");
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [duties, setDuties] = useState<DutyDay[]>([]);
  const [isLoadingDuties, setIsLoadingDuties] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.userType === "ADMIN") {
      router.push("/admin");
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchMemberProfile();
      fetchNotifications();
      fetchMemberGroup();
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMemberDuties();
    }
  }, [currentDate, status]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, duties]);

  const fetchMemberProfile = async () => {
    try {
      const response = await fetch('/api/member/profile');
      if (response.ok) {
        const data = await response.json();
        setMemberProfile(data);
      }
    } catch (error) {
      console.error('Error fetching member profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const formattedNotifications = data.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMemberDuties = async () => {
    try {
      setIsLoadingDuties(true);
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      const response = await fetch(`/api/member/duties?month=${month}&year=${year}`);
      
      if (response.ok) {
        const data = await response.json();
        setDuties(data.duties || []);
      } else {
        setDuties([]);
      }
    } catch (error) {
      console.error('Error fetching duties:', error);
      setDuties([]);
    } finally {
      setIsLoadingDuties(false);
    }
  };

  const fetchMemberGroup = async () => {
    try {
      const response = await fetch('/api/member/group');
      if (response.ok) {
        const data = await response.json();
        setMemberGroup(data.groupName || 'Not Assigned');
      } else {
        setMemberGroup('Not Assigned');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      setMemberGroup('Not Assigned');
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const lastDateOfPrevMonth = prevLastDay.getDate();
    
    const days: CalendarDay[] = [];
    
    // Create a map of duties by day from database
    const dutyMap = new Map(duties.map(d => [d.day, d.duties]));
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: lastDateOfPrevMonth - i,
        isCurrentMonth: false,
        hasDuty: false,
        duties: [],
      });
    }
    
    // Current month days
    for (let day = 1; day <= lastDateOfMonth; day++) {
      const dayDuties = dutyMap.get(day) || [];
      days.push({
        day,
        isCurrentMonth: true,
        hasDuty: dayDuties.length > 0,
        duties: dayDuties,
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        hasDuty: false,
        duties: [],
      });
    }
    
    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (calendarDay: CalendarDay) => {
    if (!calendarDay.isCurrentMonth) return;
    setSelectedDate(calendarDay.day);
  };

  const getSelectedDayDuties = () => {
    const day = calendarDays.find(d => d.day === selectedDate && d.isCurrentMonth);
    return day?.duties || [];
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    toast.success("Logging out...");
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  if (status === "loading") {
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
      {/* Header Section */}
      <div className="px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          {/* Notification Bell Icon */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-colors"
          >
            <div className="relative">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>

          {/* Logo */}
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

        {/* Welcome Text */}
        <div className="mb-6">
          <p className="text-white/80 text-sm mb-1">Welcome back!</p>
          <h1 className="text-2xl font-bold text-white">
            {memberProfile ? memberProfile.fullName : (session?.user?.name || "Member")}
          </h1>
          <p className="text-white/70 text-sm mt-1">Group: {memberGroup}</p>
        </div>

        {/* Search Bar and Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/60 text-base"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* My Group Button */}
          <button
            onClick={() => router.push('/member/group')}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </button>

          {/* Birthday Button */}
          <button
            onClick={() => router.push('/member/birthdays')}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* White Content Area */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">MY SCHEDULE</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoadingDuties}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-gray-900 min-w-[150px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoadingDuties}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingDuties && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Calendar */}
        {!isLoadingDuties && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden mb-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b-2 border-gray-200">
            {DAYS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-bold text-gray-700 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((calendarDay, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(calendarDay)}
                disabled={!calendarDay.isCurrentMonth}
                className={`
                  aspect-square p-2 border-b border-r border-gray-100 transition-all relative
                  ${!calendarDay.isCurrentMonth ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}
                  ${selectedDate === calendarDay.day && calendarDay.isCurrentMonth ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                  ${isToday(calendarDay.day) && calendarDay.isCurrentMonth ? 'bg-yellow-50' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`
                    text-sm font-semibold mb-1
                    ${!calendarDay.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                    ${isToday(calendarDay.day) && calendarDay.isCurrentMonth ? 'text-blue-600' : ''}
                  `}>
                    {calendarDay.day}
                  </span>
                  {calendarDay.hasDuty && calendarDay.isCurrentMonth && (
                    <div className="flex flex-col space-y-0.5">
                      {calendarDay.duties.slice(0, 2).map((_, idx) => (
                        <div 
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {isToday(calendarDay.day) && calendarDay.isCurrentMonth && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Selected Day Details */}
        {selectedDate && !isLoadingDuties && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Duties for {MONTHS[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
            </h3>
            {getSelectedDayDuties().length === 0 ? (
              <p className="text-gray-500 text-center py-4">No duties scheduled for this day</p>
            ) : (
              <div className="space-y-2">
                {getSelectedDayDuties().map((duty, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900">{duty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        {!isLoadingDuties && (
          <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            />
            <span className="text-gray-600">Has Duty</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-600">Selected</span>
          </div>
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
            className="flex flex-col items-center text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => router.push('/member/schedule')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Schedule</span>
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-white/80 hover:text-white font-medium"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.isRead ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <h3 className="text-lg font-bold text-white text-center">
                Confirm Logout
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}