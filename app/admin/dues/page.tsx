/* app/admin/dues/page.tsx */
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

interface Due {
  id: string;
  memberId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  member: Member;
}

export default function DuesManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDueModal, setShowAddDueModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [newDue, setNewDue] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    memberId: 'ALL', // 'ALL' means create for all members
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
    paidDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data - replace with actual API calls
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

      const mockDues: Due[] = [
        {
          id: '1',
          memberId: '1',
          title: 'Monthly Dues - February 2026',
          description: 'Regular monthly contribution for altar server activities',
          amount: 100,
          dueDate: '2026-02-15',
          status: 'PENDING',
          member: mockMembers[0],
        },
        {
          id: '2',
          memberId: '2',
          title: 'Monthly Dues - February 2026',
          description: 'Regular monthly contribution for altar server activities',
          amount: 100,
          dueDate: '2026-02-15',
          paidDate: '2026-02-10',
          status: 'PAID',
          paymentMethod: 'CASH',
          reference: 'REF001',
          member: mockMembers[1],
        },
        {
          id: '3',
          memberId: '3',
          title: 'Monthly Dues - February 2026',
          description: 'Regular monthly contribution for altar server activities',
          amount: 100,
          dueDate: '2026-02-15',
          status: 'PENDING',
          member: mockMembers[2],
        },
        {
          id: '4',
          memberId: '4',
          title: 'Monthly Dues - January 2026',
          description: 'Regular monthly contribution for altar server activities',
          amount: 100,
          dueDate: '2026-01-15',
          status: 'OVERDUE',
          member: mockMembers[3],
        },
        {
          id: '5',
          memberId: '1',
          title: 'Retreat Fee',
          description: 'Annual spiritual retreat participation fee',
          amount: 500,
          dueDate: '2026-03-01',
          status: 'PENDING',
          member: mockMembers[0],
        },
      ];

      setMembers(mockMembers);
      setDues(mockDues);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setIsLoading(false);
    }
  };

  const handleAddDue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(newDue.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (newDue.memberId === 'ALL') {
        // Create dues for all active members
        const newDues = members
          .filter(m => m.status === 'ACTIVE')
          .map(member => ({
            id: `${Date.now()}-${member.id}`,
            memberId: member.id,
            title: newDue.title,
            description: newDue.description,
            amount,
            dueDate: newDue.dueDate,
            status: 'PENDING' as const,
            member,
          }));
        
        setDues([...dues, ...newDues]);
        toast.success(`Created dues for ${newDues.length} members`);
      } else {
        // Create due for specific member
        const member = members.find(m => m.id === newDue.memberId);
        if (!member) {
          toast.error('Member not found');
          return;
        }

        const newDueRecord: Due = {
          id: Date.now().toString(),
          memberId: newDue.memberId,
          title: newDue.title,
          description: newDue.description,
          amount,
          dueDate: newDue.dueDate,
          status: 'PENDING',
          member,
        };

        setDues([...dues, newDueRecord]);
        toast.success('Due added successfully!');
      }

      setNewDue({
        title: '',
        description: '',
        amount: '',
        dueDate: '',
        memberId: 'ALL',
      });
      setShowAddDueModal(false);
    } catch (error) {
      console.error('Error adding due:', error);
      toast.error('Failed to add due');
    }
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue) return;

    try {
      const updatedDues = dues.map(due =>
        due.id === selectedDue.id
          ? {
              ...due,
              status: 'PAID' as const,
              paidDate: paymentData.paidDate,
              paymentMethod: paymentData.paymentMethod,
              reference: paymentData.reference || undefined,
              notes: paymentData.notes || undefined,
            }
          : due
      );

      setDues(updatedDues);
      setShowPaymentModal(false);
      setSelectedDue(null);
      setPaymentData({
        paymentMethod: 'CASH',
        reference: '',
        notes: '',
        paidDate: new Date().toISOString().split('T')[0],
      });
      toast.success('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleWaiveDue = async (dueId: string) => {
    if (!confirm('Are you sure you want to waive this due?')) return;

    try {
      const updatedDues = dues.map(due =>
        due.id === dueId
          ? { ...due, status: 'WAIVED' as const }
          : due
      );
      setDues(updatedDues);
      toast.success('Due waived successfully!');
    } catch (error) {
      console.error('Error waiving due:', error);
      toast.error('Failed to waive due');
    }
  };

  const handleDeleteDue = async (dueId: string) => {
    if (!confirm('Are you sure you want to delete this due?')) return;

    try {
      const updatedDues = dues.filter(due => due.id !== dueId);
      setDues(updatedDues);
      toast.success('Due deleted successfully!');
    } catch (error) {
      console.error('Error deleting due:', error);
      toast.error('Failed to delete due');
    }
  };

  const getFilteredDues = () => {
    return dues
      .filter(due => {
        if (statusFilter !== 'ALL' && due.status !== statusFilter) return false;
        if (memberFilter !== 'ALL' && due.memberId !== memberFilter) return false;
        if (searchTerm && !due.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !`${due.member.firstName} ${due.member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'WAIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalStats = () => {
    const total = dues.reduce((sum, due) => sum + due.amount, 0);
    const paid = dues.filter(d => d.status === 'PAID').reduce((sum, due) => sum + due.amount, 0);
    const pending = dues.filter(d => d.status === 'PENDING').reduce((sum, due) => sum + due.amount, 0);
    const overdue = dues.filter(d => d.status === 'OVERDUE').reduce((sum, due) => sum + due.amount, 0);

    return { total, paid, pending, overdue };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredDues = getFilteredDues();
  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dues Management</h1>
              <p className="text-gray-600 mt-2">Track monthly dues and payments from altar server members</p>
            </div>
            <button
              onClick={() => setShowAddDueModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Due</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">₱{stats.total.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Dues</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">₱{stats.paid.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Paid</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">₱{stats.pending.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">₱{stats.overdue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search dues or members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="WAIVED">Waived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Members</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} ({member.memberNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setMemberFilter('ALL');
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Dues Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDues.map((due) => (
                  <tr key={due.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {due.member.firstName.charAt(0)}{due.member.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {due.member.firstName} {due.member.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{due.member.memberNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{due.title}</div>
                      {due.description && (
                        <div className="text-sm text-gray-500">{due.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">₱{due.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(due.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(due.status)}`}>
                        {due.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {due.paidDate && (
                        <div>
                          <div>Paid: {new Date(due.paidDate).toLocaleDateString()}</div>
                          <div>{due.paymentMethod}</div>
                          {due.reference && <div>Ref: {due.reference}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {due.status === 'PENDING' || due.status === 'OVERDUE' ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDue(due);
                                setShowPaymentModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Mark as Paid"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleWaiveDue(due.id)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Waive"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => handleDeleteDue(due.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDues.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <p className="mt-4 text-lg text-gray-900">No dues found</p>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Due Modal */}
      {showAddDueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Due</h3>
            </div>
            <form onSubmit={handleAddDue} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newDue.title}
                    onChange={(e) => setNewDue({...newDue, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Monthly Dues - February 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newDue.description}
                    onChange={(e) => setNewDue({...newDue, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newDue.amount}
                    onChange={(e) => setNewDue({...newDue, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDue.dueDate}
                    onChange={(e) => setNewDue({...newDue, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={newDue.memberId}
                    onChange={(e) => setNewDue({...newDue, memberId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Active Members</option>
                    {members.filter(m => m.status === 'ACTIVE').map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName} ({member.memberNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDueModal(false);
                    setNewDue({
                      title: '',
                      description: '',
                      amount: '',
                      dueDate: '',
                      memberId: 'ALL',
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
                  Add Due
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedDue.member.firstName} {selectedDue.member.lastName} - {selectedDue.title}
              </p>
            </div>
            <form onSubmit={handleMarkPaid} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentData.paidDate}
                    onChange={(e) => setPaymentData({...paymentData, paidDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="GCASH">GCash</option>
                    <option value="PAYMAYA">PayMaya</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Amount Due:</span>
                    <span className="font-semibold">₱{selectedDue.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDue(null);
                    setPaymentData({
                      paymentMethod: 'CASH',
                      reference: '',
                      notes: '',
                      paidDate: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}