/* app/admin/attendance/page.tsx */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  level: string;
  status: string;
}

interface Event {
  id: string;
  title: string;
  eventType: string;
  date: string;
  startTime: string;
  location: string;
}

interface Attendance {
  id: string;
  memberId: string;
  eventId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  timeIn?: string;
  timeOut?: string;
  notes?: string;
  member: Member;
}

export default function AttendanceManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    eventType: 'SUNDAY_MASS',
    date: '',
    startTime: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Sunday Mass - 8:00 AM',
          eventType: 'SUNDAY_MASS',
          date: '2026-02-02',
          startTime: '08:00',
          location: 'Main Altar',
        },
        {
          id: '2',
          title: 'Monthly Meeting',
          eventType: 'MONTHLY_MEETING',
          date: '2026-02-05',
          startTime: '19:00',
          location: 'Parish Hall',
        },
        {
          id: '3',
          title: 'Training Session',
          eventType: 'TRAINING',
          date: '2026-02-08',
          startTime: '14:00',
          location: 'Sacristy',
        },
        {
          id: '4',
          title: 'Daily Mass - Wednesday',
          eventType: 'DAILY_MASS',
          date: '2026-01-29',
          startTime: '06:00',
          location: 'Side Chapel',
        },
      ];

      const mockMembers: Member[] = [
        {
          id: '1',
          memberNumber: 'AS001',
          firstName: 'John',
          lastName: 'Doe',
          level: 'INTERMEDIATE',
          status: 'ACTIVE',
        },
        {
          id: '2',
          memberNumber: 'AS002',
          firstName: 'Maria',
          lastName: 'Santos',
          level: 'SENIOR',
          status: 'ACTIVE',
        },
        {
          id: '3',
          memberNumber: 'AS003',
          firstName: 'Miguel',
          lastName: 'Rodriguez',
          level: 'JUNIOR',
          status: 'ACTIVE',
        },
        {
          id: '4',
          memberNumber: 'AS004',
          firstName: 'Anna',
          lastName: 'Cruz',
          level: 'INTERMEDIATE',
          status: 'ACTIVE',
        },
      ];

      // Mock attendance data
      const mockAttendances: Attendance[] = [
        {
          id: '1',
          memberId: '1',
          eventId: '4',
          status: 'PRESENT',
          timeIn: '05:55',
          member: mockMembers[0],
        },
        {
          id: '2',
          memberId: '2',
          eventId: '4',
          status: 'PRESENT',
          timeIn: '05:58',
          member: mockMembers[1],
        },
        {
          id: '3',
          memberId: '3',
          eventId: '4',
          status: 'LATE',
          timeIn: '06:15',
          notes: 'Traffic',
          member: mockMembers[2],
        },
        {
          id: '4',
          memberId: '4',
          eventId: '4',
          status: 'EXCUSED',
          notes: 'Sick',
          member: mockMembers[3],
        },
      ];

      setEvents(mockEvents);
      setMembers(mockMembers);
      setAttendances(mockAttendances);
      setSelectedEvent(mockEvents[0]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (memberId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', notes?: string) => {
    if (!selectedEvent) return;

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const existingAttendance = attendances.find(
        a => a.memberId === memberId && a.eventId === selectedEvent.id
      );

      if (existingAttendance) {
        const updatedAttendances = attendances.map(a =>
          a.id === existingAttendance.id
            ? {
                ...a,
                status,
                timeIn: status === 'PRESENT' || status === 'LATE' ? new Date().toTimeString().slice(0, 5) : undefined,
                notes: notes || a.notes,
              }
            : a
        );
        setAttendances(updatedAttendances);
      } else {
        const newAttendance: Attendance = {
          id: Date.now().toString(),
          memberId,
          eventId: selectedEvent.id,
          status,
          timeIn: status === 'PRESENT' || status === 'LATE' ? new Date().toTimeString().slice(0, 5) : undefined,
          notes,
          member,
        };
        setAttendances([...attendances, newAttendance]);
      }

      toast.success(`Attendance marked as ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData: Event = {
        id: Date.now().toString(),
        ...newEvent,
      };

      setEvents([...events, eventData]);
      setNewEvent({
        title: '',
        eventType: 'SUNDAY_MASS',
        date: '',
        startTime: '',
        location: '',
        description: '',
      });
      setShowAddEventModal(false);
      toast.success('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const getEventAttendances = () => {
    if (!selectedEvent) return [];
    return attendances.filter(a => a.eventId === selectedEvent.id);
  };

  const getEventMembersWithAttendance = () => {
    const eventAttendances = getEventAttendances();
    
    return members
      .filter(member => member.status === 'ACTIVE')
      .filter(member => 
        searchTerm === '' || 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(member => {
        const attendance = eventAttendances.find(a => a.memberId === member.id);
        return {
          ...member,
          attendance: attendance || null,
        };
      })
      .filter(member => {
        if (attendanceFilter === 'ALL') return true;
        if (attendanceFilter === 'UNMARKED') return !member.attendance;
        return member.attendance?.status === attendanceFilter;
      });
  };

  const getAttendanceStats = () => {
    const eventAttendances = getEventAttendances();
    const totalMembers = members.filter(m => m.status === 'ACTIVE').length;
    const present = eventAttendances.filter(a => a.status === 'PRESENT').length;
    const late = eventAttendances.filter(a => a.status === 'LATE').length;
    const absent = eventAttendances.filter(a => a.status === 'ABSENT').length;
    const excused = eventAttendances.filter(a => a.status === 'EXCUSED').length;
    const unmarked = totalMembers - eventAttendances.length;

    return { totalMembers, present, late, absent, excused, unmarked };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'EXCUSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'SUNDAY_MASS': return 'bg-blue-100 text-blue-800';
      case 'DAILY_MASS': return 'bg-green-100 text-green-800';
      case 'MONTHLY_MEETING': return 'bg-purple-100 text-purple-800';
      case 'TRAINING': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getAttendanceStats();
  const membersWithAttendance = getEventMembersWithAttendance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600 mt-2">Track attendance for masses, meetings, and events</p>
            </div>
            <button
              onClick={() => setShowAddEventModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Event</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Event Selection and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Event Selection */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEvent?.id === event.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.date).toLocaleDateString()} at {event.startTime}
                      </p>
                      <p className="text-sm text-gray-500">{event.location}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.eventType)}`}>
                      {event.eventType.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Overview</h2>
            {selectedEvent && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="font-semibold">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Present</span>
                  <span className="font-semibold text-green-600">{stats.present}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600">Late</span>
                  <span className="font-semibold text-yellow-600">{stats.late}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Absent</span>
                  <span className="font-semibold text-red-600">{stats.absent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">Excused</span>
                  <span className="font-semibold text-blue-600">{stats.excused}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unmarked</span>
                  <span className="font-semibold text-gray-600">{stats.unmarked}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="font-bold text-lg">
                      {stats.totalMembers > 0 ? Math.round(((stats.present + stats.late) / stats.totalMembers) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Management */}
        {selectedEvent && (
          <div className="bg-white rounded-lg shadow-lg">
            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-gray-900">
                  Mark Attendance - {selectedEvent.title}
                </h2>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Members</option>
                    <option value="UNMARKED">Unmarked</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="divide-y divide-gray-200">
              {membersWithAttendance.map((member) => (
                <div key={member.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.memberNumber} • {member.level}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {member.attendance && (
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.attendance.status)}`}>
                            {member.attendance.status}
                          </span>
                          {member.attendance.timeIn && (
                            <span className="text-xs text-gray-500">
                              {member.attendance.timeIn}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMarkAttendance(member.id, 'PRESENT')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(member.id, 'LATE')}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(member.id, 'ABSENT')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(member.id, 'EXCUSED')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          Excused
                        </button>
                      </div>
                    </div>
                  </div>
                  {member.attendance?.notes && (
                    <div className="mt-2 ml-14">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Notes:</span> {member.attendance.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {membersWithAttendance.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-4 text-lg text-gray-900">No members found</p>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Event</h3>
            </div>
            <form onSubmit={handleAddEvent} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({...newEvent, eventType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SUNDAY_MASS">Sunday Mass</option>
                    <option value="DAILY_MASS">Daily Mass</option>
                    <option value="MONTHLY_MEETING">Monthly Meeting</option>
                    <option value="TRAINING">Training</option>
                    <option value="RETREAT">Retreat</option>
                    <option value="CELEBRATION">Celebration</option>
                    <option value="SPECIAL_EVENT">Special Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEventModal(false);
                    setNewEvent({
                      title: '',
                      eventType: 'SUNDAY_MASS',
                      date: '',
                      startTime: '',
                      location: '',
                      description: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}