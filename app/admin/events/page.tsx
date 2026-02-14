/* app/admin/events/page.tsx */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  conductor: string;
  purpose: string;
  year: number;
  createdAt: Date;
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'create'>('events');
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '10:00',
    conductor: '',
    purpose: '',
  });

  const currentDate = new Date();

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.userType !== 'ADMIN') {
        router.push('/member/dashboard');
        return;
      }
      fetchEvents();
    } else if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, session, router]);
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      // Ensure dates are strings for client usage
      const normalized: Event[] = data.map((e: any) => ({
        ...e,
        date: e.date,
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
      }));
      setEvents(normalized);
    } catch (err) {
      console.error(err);
      toast.error('Could not load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    if (!formData.title || !formData.date || !formData.time || !formData.conductor || !formData.purpose) {
      toast.error('Please fill in all fields');
      return;
    }
    // Send to API
    (async () => {
      try {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create event');
        const created = await res.json();
        const createdEvent: Event = {
          ...created,
          date: created.date,
          createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
        };
        setEvents((prev) => [...prev, createdEvent]);
        setFormData({ title: '', date: '', time: '10:00', conductor: '', purpose: '' });
        toast.success('Event created successfully!');
        setActiveTab('events');
      } catch (err) {
        console.error(err);
        toast.error('Could not create event');
      }
    })();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete event');
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setShowEventDetailModal(false);
        toast.success('Event deleted');
      } catch (err) {
        console.error(err);
        toast.error('Could not delete event');
      }
    })();
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
  };

  const getUpcomingEvents = () => {
    return events
      .filter(event => new Date(event.date) >= currentDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const getEventsByYear = (year: number) => {
    return events
      .filter(event => event.year === year)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMonthFromDate = (dateString: string) => {
    return new Date(dateString).getMonth();
  };

  const getDayFromDate = (dateString: string) => {
    return new Date(dateString).getDate();
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
            {/* Events List Tab */}
            <button
              onClick={() => setActiveTab('events')}
              style={{
                background: activeTab === 'events' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : 'white',
                borderColor: activeTab === 'events' ? 'transparent' : '#4169E1'
              }}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'events'
                  ? 'shadow-md'
                  : 'border-2'
              }`}
              title="Events List"
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'events' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* Create Event Tab */}
            <button
              onClick={() => setActiveTab('create')}
              style={{
                background: activeTab === 'create' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : 'white',
                borderColor: activeTab === 'create' ? 'transparent' : '#4169E1'
              }}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'create'
                  ? 'shadow-md'
                  : 'border-2'
              }`}
              title="Create Event"
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'create' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">EVENT TRACKER</h2>

        {/* Events List Tab Content */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Upcoming Events Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
                <button
                  onClick={() => setActiveTab('create')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Event</span>
                </button>
              </div>

              {getUpcomingEvents().length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-lg border-2 border-gray-200">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mb-4">No upcoming events</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUpcomingEvents().map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Date Box */}
                        <div 
                          className="flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white"
                          style={{
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                          }}
                        >
                          <span className="text-xs font-semibold uppercase">
                            {MONTHS[getMonthFromDate(event.date)].slice(0, 3)}
                          </span>
                          <span className="text-2xl font-bold">
                            {getDayFromDate(event.date)}
                          </span>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1 truncate">{event.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formatTime(event.time)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="truncate">{event.conductor}</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Year Selector */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Events by Year</h3>
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 mb-4">
                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    style={{
                      background: selectedYear === year 
                        ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                        : '#f3f4f6'
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all shadow-sm ${
                      selectedYear === year
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {/* Events List by Year */}
              {getEventsByYear(selectedYear).length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-gray-500">No events for {selectedYear}</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {getEventsByYear(selectedYear).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1 truncate">{event.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{formatDate(event.date)}</span>
                              <span>•</span>
                              <span>{formatTime(event.time)}</span>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Event Tab Content */}
        {activeTab === 'create' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h3>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    What is the event? *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Annual Ministry Retreat"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      When is the event? *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Who will conduct the event? *
                  </label>
                  <input
                    type="text"
                    value={formData.conductor}
                    onChange={(e) => setFormData({ ...formData, conductor: e.target.value })}
                    placeholder="e.g., Fr. John Smith"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purpose of the event *
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Describe the purpose and objectives of this event..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setActiveTab('events')}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    style={{
                      background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                    }}
                    className="flex-1 px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div 
              className="text-white p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Event Details</h3>
                <button
                  onClick={() => setShowEventDetailModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Event Title */}
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h4>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Date</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(selectedEvent.date)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Time</p>
                  <p className="text-sm font-bold text-gray-900">{formatTime(selectedEvent.time)}</p>
                </div>
              </div>

              {/* Conductor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Event Conductor</p>
                <p className="text-sm font-semibold text-gray-900">{selectedEvent.conductor}</p>
              </div>

              {/* Purpose */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2 font-semibold uppercase">Purpose</p>
                <p className="text-sm text-gray-900 leading-relaxed">{selectedEvent.purpose}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEventDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
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