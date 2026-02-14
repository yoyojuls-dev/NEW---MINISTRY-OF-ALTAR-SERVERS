// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface Activity {
  id: number;
  type: string;
  message: string;
  time: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    seniorServers: 0,
    upcomingEvents: 0,
    pendingDues: 0,
    monthlyAttendance: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      setIsAuthenticated(true);
      setIsLoading(false);
      fetchDashboardData();
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalMembers: 24,
        activeMembers: 22,
        seniorServers: 8,
        upcomingEvents: 5,
        pendingDues: 3,
        monthlyAttendance: 85,
      });

      setRecentActivities([
        { id: 1, type: 'attendance', message: 'Sunday Mass attendance recorded', time: '2 hours ago' },
        { id: 2, type: 'member', message: 'New member John Doe registered', time: '1 day ago' },
        { id: 3, type: 'payment', message: 'Monthly dues payment received from Maria Santos', time: '2 days ago' },
        { id: 4, type: 'event', message: 'Training session scheduled for next week', time: '3 days ago' },
      ]);

      setUpcomingEvents([
        { id: 1, title: 'Sunday Mass', date: '2026-02-02', time: '08:00 AM', type: 'SUNDAY_MASS' },
        { id: 2, title: 'Monthly Meeting', date: '2026-02-05', time: '07:00 PM', type: 'MONTHLY_MEETING' },
        { id: 3, title: 'Training Session', date: '2026-02-08', time: '02:00 PM', type: 'TRAINING' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
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

  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
        }}
      >
        <div className="text-center bg-white rounded-2xl p-8 max-w-md mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be logged in as an administrator to access this page.</p>
          <button
            onClick={() => router.push('/admin/login')}
            style={{
              background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
            }}
            className="text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Go to Login
          </button>
        </div>
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
      {/* Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16">
              <Image
                src="/images/MAS LOGO.png"
                alt="Ministry of Altar Servers Logo"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/80">Ministry of Altar Servers</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{formatDate(currentTime)}</p>
              <p className="text-lg font-bold text-white">{formatTime(currentTime)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {session?.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
              <p className="text-xs text-gray-600">Total Members</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-green-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
              <p className="text-xs text-gray-600">Active Members</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-purple-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.seniorServers}</p>
              <p className="text-xs text-gray-600">Senior Servers</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-orange-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              <p className="text-xs text-gray-600">Upcoming Events</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-red-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingDues}</p>
              <p className="text-xs text-gray-600">Pending Dues</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-yellow-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyAttendance}%</p>
              <p className="text-xs text-gray-600">Attendance Rate</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <button 
              onClick={() => router.push('/admin/members')}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Members</span>
            </button>

            <button 
              onClick={() => router.push('/admin/attendance')}
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Attendance</span>
            </button>

            <button 
              onClick={() => router.push('/admin/events')}
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Events</span>
            </button>

            <button 
              onClick={() => router.push('/admin/monthly-meeting')}
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Meeting</span>
            </button>

            <button 
              onClick={() => router.push('/admin/birthdays')}
              className="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Birthdays</span>
            </button>

            <button 
              onClick={() => router.push('/admin/reports')}
              className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Reports</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
              <button 
                onClick={() => router.push('/admin/activities')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'attendance' ? 'bg-green-100' :
                    activity.type === 'member' ? 'bg-blue-100' :
                    activity.type === 'payment' ? 'bg-yellow-100' :
                    'bg-purple-100'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      activity.type === 'attendance' ? 'text-green-600' :
                      activity.type === 'member' ? 'text-blue-600' :
                      activity.type === 'payment' ? 'text-yellow-600' :
                      'text-purple-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
              <button 
                onClick={() => router.push('/admin/events')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    event.type === 'SUNDAY_MASS' ? 'bg-blue-500' :
                    event.type === 'MONTHLY_MEETING' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.date} at {event.time}</p>
                  </div>
                  <button 
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            className="flex flex-col items-center text-white transition-colors"
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