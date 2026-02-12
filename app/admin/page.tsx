// app/admin/page.tsx - Updated to match gradient blue design
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  message: string;
  type: 'update' | 'change' | 'reminder';
  timestamp: Date;
  isRead: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  conductor: string;
  purpose: string;
  year: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.userType !== "ADMIN") {
      router.push("/member/dashboard");
      return;
    }

    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    fetchNotifications();
    fetchUpcomingEvents();
  }, [session, status, router]);

  const fetchNotifications = async () => {
    try {
      // Fetch notifications from API
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const formattedNotifications = data.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter((n: Notification) => !n.isRead).length);
      } else {
        // Fallback to sample data if API fails
        loadSampleNotifications();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      loadSampleNotifications();
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      // Fetch events from API
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        
        // Filter upcoming events (future dates only)
        const now = new Date();
        const upcoming = data
          .filter((event: Event) => new Date(event.date) >= now)
          .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3); // Get first 3 upcoming events
        
        setUpcomingEvents(upcoming);
      } else {
        // Fallback to sample data if API fails
        loadSampleEvents();
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      loadSampleEvents();
    }
  };

  const loadSampleNotifications = () => {
    const sampleNotifications: Notification[] = [
      {
        id: "1",
        message: "Monthly Meeting on February 1st, 2026 (Sunday - 1pm @ Multi-Purpose Hall)",
        type: "reminder",
        timestamp: new Date("2026-01-31"),
        isRead: false
      },
      {
        id: "2",
        message: "Birthday of User User",
        type: "update",
        timestamp: new Date("2026-01-30"),
        isRead: false
      },
      {
        id: "3",
        message: "New member added to altar servers",
        type: "change",
        timestamp: new Date("2026-01-29"),
        isRead: false
      }
    ];
    
    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.isRead).length);
  };

  const loadSampleEvents = () => {
    const sampleEvents: Event[] = [
      {
        id: '1',
        title: 'Annual Ministry Retreat',
        date: '2026-03-15',
        time: '09:00',
        conductor: 'Fr. John Smith',
        purpose: 'Spiritual renewal and team building',
        year: 2026,
      },
      {
        id: '2',
        title: 'Holy Week Training',
        date: '2026-04-05',
        time: '14:00',
        conductor: 'Deacon Michael Brown',
        purpose: 'Preparation for Holy Week liturgies',
        year: 2026,
      },
    ];
    
    setUpcomingEvents(sampleEvents);
  };

  const formatEventDate = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const year = date.getFullYear();
    
    // Format time to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const formattedTime = `${displayHour}:${minutes}${ampm}`;
    
    return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${year} (${dayName} - ${formattedTime})`;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update notification in database
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update UI even if API fails
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
      // Update all notifications in database
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Still update UI even if API fails
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    toast.success("Logging out...");
    await signOut({ redirect: true, callbackUrl: "/" });
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
            {session?.user?.name || "Admin Admin"}
          </h1>
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

          {/* User Management Button */}
          <button
            onClick={() => router.push('/admin/members')}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </button>

          {/* Birthday Button */}
          <button
            onClick={() => router.push('/admin/birthdays')}
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
        {/* Main Action Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Monthly Meeting Card */}
          <button
            onClick={() => router.push('/admin/monthly-meeting')}
            className="bg-white border-2 border-orange-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-105 transform text-left"
          >
            <div className="flex items-start mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-orange-600 mb-1 font-medium">1st Sunday of the Month</p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Monthly<br/>Meeting</h3>
          </button>

          {/* Sunday Groups Card */}
          <button
            onClick={() => router.push('/admin/sunday-service')}
            className="bg-white border-2 border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-105 transform text-left"
          >
            <div className="flex items-start mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1 font-medium">Sunday Service</p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Sunday<br/>Groups</h3>
          </button>

          {/* Daily Masses Card */}
          <button
            onClick={() => router.push('/admin/daily-attendance')}
            className="bg-white border-2 border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-105 transform text-left"
          >
            <div className="flex items-start mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1 font-medium">Daily Attendance</p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Daily<br/>Masses</h3>
          </button>

          {/* Event Tracker Card */}
          <button
            onClick={() => router.push('/admin/events')}
            className="bg-white border-2 border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-105 transform text-left"
          >
            <div className="flex items-start mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1 font-medium">Event List</p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Event<br/>Tracker</h3>
          </button>
        </div>

        {/* Upcoming Events Section */}
        <div className="bg-gradient-to-r from-red-400 to-pink-400 rounded-3xl p-5 shadow-sm border-2 border-red-200 mb-6">
          <div className="flex items-start mb-3">
            <svg className="w-5 h-5 text-red-900 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Upcoming</h3>
          </div>
          
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="text-sm text-gray-900">
                <p>No upcoming events scheduled</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">•</span>
                  <p className="text-sm text-gray-900">
                    {event.title} on {formatEventDate(event.date, event.time)}
                  </p>
                </div>
              ))
            )}
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
            onClick={() => router.push('/admin/attendance')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs">Attendance</span>
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
                Are you sure you want to logout? You will need to login again to access the admin panel.
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