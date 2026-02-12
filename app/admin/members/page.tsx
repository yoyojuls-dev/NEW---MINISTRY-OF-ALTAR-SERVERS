// app/admin/members/page.tsx - Updated with gradient blue design
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Member {
  id: string;
  surname: string;
  givenName: string;
  email: string;
  birthdate: string;
  age: number;
  address: string;
  parentContact: string;
  dateJoined: string;
  yearsOfService: number;
  serviceLevel: 'Neophyte' | 'Junior' | 'Senior Server';
  memberStatus: string;
  createdAt: string;
}

interface Officer {
  id: string;
  memberId: string;
  memberName: string;
  position: string;
  email: string;
  contactNumber: string;
  dateAppointed: string;
  isActive: boolean;
}

interface Admin {
  id: string;
  adminId: string;
  name: string;
  email: string;
  position: string;
  contactNumber: string;
  createdAt: string;
}

interface RemoveConfirmation {
  isOpen: boolean;
  member: Member | null;
}

// Helper function to format name as "Surname, I."
const formatMemberName = (surname: string, givenName: string) => {
  const initials = givenName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('.');
  return `${surname}, ${initials}.`;
};

// Helper function to get full name
const getFullName = (surname: string, givenName: string) => {
  return `${givenName} ${surname}`;
};

type TabType = 'members' | 'officers' | 'admins';

const OFFICER_POSITIONS = [
  'President',
  'Vice President', 
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Auditor',
  'Worship Committee',
  'Social Action Committee',
  'Social Media Committee',
  'Formation Committee',
  'Morning Cluster Head',
  'Afternoon Cluster Head',
  'Leader'
];

export default function UserManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showAddOfficerForm, setShowAddOfficerForm] = useState(false);
  const [removeConfirmation, setRemoveConfirmation] = useState<RemoveConfirmation>({
    isOpen: false,
    member: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    surname: "",
    givenName: "",
    birthday: "",
    address: "",
    parentContact: "",
    dateOfInvestiture: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });
  const [officerFormData, setOfficerFormData] = useState({
    memberId: "",
    position: "",
    dateAppointed: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadMembers(),
      loadOfficers(),
      loadAdmins()
    ]);
    setLoading(false);
  };

  const loadMembers = async () => {
  try {
    console.log("Loading members from API...");
    const response = await fetch("/api/members?status=ACTIVE");
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Members loaded:", data);
    
    // Map members data and add calculated fields
    const membersWithCalculatedFields = data.map((member: any) => {
      const age = member.birthdate ? calculateAge(member.birthdate) : 0;
      const yearsOfService = member.dateJoined ? calculateYearsOfService(member.dateJoined) : 0;
      
      return {
        ...member,
        age,
        yearsOfService,
        serviceLevel: member.serverLevel || determineServiceLevel(yearsOfService)
      };
    });
    
    setMembers(membersWithCalculatedFields);
  } catch (error) {
    console.error("Error loading members:", error);
    toast.error("Failed to load members from database");
    setMembers([]);
  }
};

  const loadOfficers = async () => {
    setOfficers([]);
  };

  const loadAdmins = async () => {
    setAdmins([]);
  };

  const calculateAge = (birthday: string): number => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateYearsOfService = (dateOfInvestiture: string): number => {
    const today = new Date();
    const investitureDate = new Date(dateOfInvestiture);
    let years = today.getFullYear() - investitureDate.getFullYear();
    const monthDiff = today.getMonth() - investitureDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < investitureDate.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  const determineServiceLevel = (yearsOfService: number): 'Neophyte' | 'Junior' | 'Senior Server' => {
  if (yearsOfService >= 1 && yearsOfService <= 2) return 'Neophyte';
  if (yearsOfService >= 3 && yearsOfService <= 4) return 'Junior';
  if (yearsOfService >= 5) return 'Senior Server';
  return 'Neophyte'; // Default for 0 years
};

  const getServiceLevelAbbreviation = (level: string): string => {
  switch (level) {
    case 'NEOPHYTE':
      return 'NEOPHYTE';
    case 'SENIOR':
      return 'JUNIOR';
    case 'Senior Server':
      return 'SENIOR';
    default: return 'SENIOR';
  }
};

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberFormData.surname || !memberFormData.givenName || !memberFormData.birthday || !memberFormData.address || 
        !memberFormData.parentContact || !memberFormData.dateOfInvestiture || 
        !memberFormData.username || !memberFormData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (memberFormData.password !== memberFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (memberFormData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    try {
      console.log("Creating member via API...");
      
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surname: memberFormData.surname,
          givenName: memberFormData.givenName,
          birthday: memberFormData.birthday,
          address: memberFormData.address,
          parentContact: memberFormData.parentContact,
          dateOfInvestiture: memberFormData.dateOfInvestiture,
          username: memberFormData.username,
          password: memberFormData.password,
          email: memberFormData.email || `${memberFormData.username}@ministry.local`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      toast.success(`Member created successfully!`);
      console.log("Member created successfully:", data.member);
      
      await loadMembers();
      
      setShowAddMemberForm(false);
      setMemberFormData({
        surname: "",
        givenName: "",
        birthday: "",
        address: "",
        parentContact: "",
        dateOfInvestiture: "",
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
      });
      
    } catch (error: any) {
      console.error("Error creating member:", error);
      toast.error(error.message || "Failed to create member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!officerFormData.memberId || !officerFormData.position) {
      toast.error("Please select a member and position");
      return;
    }

    const existingOfficer = officers.find(officer => 
      officer.position === officerFormData.position && officer.isActive
    );
    
    if (existingOfficer) {
      toast.error(`Position "${officerFormData.position}" is already assigned to ${existingOfficer.memberName}`);
      return;
    }

    const memberIsOfficer = officers.find(officer => 
      officer.memberId === officerFormData.memberId && officer.isActive
    );
    
    if (memberIsOfficer) {
      toast.error(`This member is already assigned as ${memberIsOfficer.position}`);
      return;
    }

    setSubmitting(true);

    try {
      const selectedMember = members.find(member => member.id === officerFormData.memberId);
      if (!selectedMember) {
        throw new Error("Selected member not found");
      }

      const newOfficer: Officer = {
        id: `officer-${Date.now()}`,
        memberId: officerFormData.memberId,
        memberName: formatMemberName(selectedMember.surname, selectedMember.givenName),
        position: officerFormData.position,
        email: selectedMember.email,
        contactNumber: selectedMember.parentContact,
        dateAppointed: officerFormData.dateAppointed,
        isActive: true
      };

      setOfficers([...officers, newOfficer]);
      toast.success(`${formatMemberName(selectedMember.surname, selectedMember.givenName)} appointed as ${officerFormData.position}!`);
      
      setShowAddOfficerForm(false);
      setOfficerFormData({
        memberId: "",
        position: "",
        dateAppointed: new Date().toISOString().split('T')[0],
      });
      
    } catch (error: any) {
      console.error("Error appointing officer:", error);
      toast.error(error.message || "Failed to appoint officer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveClick = (member: Member) => {
    setRemoveConfirmation({
      isOpen: true,
      member: member
    });
  };

  const handleConfirmRemove = async () => {
    if (!removeConfirmation.member) return;

    try {
      console.log("Removing member:", removeConfirmation.member.id);
      
      const response = await fetch(`/api/members/${removeConfirmation.member.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success(`${formatMemberName(removeConfirmation.member.surname, removeConfirmation.member.givenName)} has been removed`);
      
      setMembers(prev => prev.filter(m => m.id !== removeConfirmation.member?.id));
      setRemoveConfirmation({ isOpen: false, member: null });
      
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Failed to remove member");
    }
  };

  const handleCancelRemove = () => {
    setRemoveConfirmation({ isOpen: false, member: null });
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMemberFormData({
      ...memberFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOfficerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOfficerFormData({
      ...officerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const removeOfficer = (officerId: string) => {
    const officer = officers.find(o => o.id === officerId);
    if (officer) {
      setOfficers(officers.filter(o => o.id !== officerId));
      toast.success(`${officer.memberName} removed from ${officer.position}`);
    }
  };

  const handleBackClick = () => {
    router.push('/admin');
  };

  const getAvailableMembers = () => {
    const activeOfficerMemberIds = officers.filter(o => o.isActive).map(o => o.memberId);
    return members.filter(member => 
      member.memberStatus === 'ACTIVE' && 
      !activeOfficerMemberIds.includes(member.id)
    );
  };

  const getAvailablePositions = () => {
    const takenPositions = officers.filter(o => o.isActive).map(o => o.position);
    return OFFICER_POSITIONS.filter(position => !takenPositions.includes(position));
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'members':
        return (
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 mb-4">No members found in database</p>
                <button
                  onClick={() => setShowAddMemberForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first member
                </button>
              </div>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {formatMemberName(member.surname, member.givenName)}
                    </div>
                    <div className="text-gray-600">
                      {new Date(member.birthdate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-gray-600">{member.age || 0}</div>
                    <div>
                      <span 
                        className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                        style={{
                          background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                        }}
                      >
                        {getServiceLevelAbbreviation(member.serviceLevel)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      
      case 'officers':
        return (
          <div className="space-y-2">
            {officers.filter(officer => officer.isActive).map((officer) => (
              <div key={officer.id} className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="font-medium text-gray-900">
                    {officer.memberName}
                    <div className="text-xs text-gray-500">{officer.position}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">{officer.contactNumber}</div>
                    <button
                      onClick={() => removeOfficer(officer.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {officers.filter(officer => officer.isActive).length === 0 && (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 mb-4">No officers appointed yet</p>
                <button
                  onClick={() => setShowAddOfficerForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Appoint your first officer
                </button>
              </div>
            )}
          </div>
        );
      
      case 'admins':
        return (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="bg-white p-4 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-medium text-gray-900">
                    {admin.name}
                    <div className="text-xs text-gray-500">{admin.adminId}</div>
                  </div>
                  <div className="text-gray-600">{admin.position}</div>
                  <div className="text-gray-600 text-sm">{admin.contactNumber}</div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  const getTabHeaders = () => {
    switch (activeTab) {
      case 'members':
        return ['Members', 'Birthday', 'Age', 'Level'];
      case 'officers':
        return ['Officers', 'Contact Number'];
      case 'admins':
        return ['Admins', 'Position', 'Contact'];
      default:
        return [];
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case 'members':
        return '+ Members';
      case 'officers':
        return '+ Officer';
      case 'admins':
        return '+ Admin';
      default:
        return '+ Add';
    }
  };

  const handleAddButtonClick = () => {
    switch (activeTab) {
      case 'members':
        setShowAddMemberForm(true);
        break;
      case 'officers':
        setShowAddOfficerForm(true);
        break;
      case 'admins':
        toast("Add admin functionality coming soon!", {
          icon: '💼',
          duration: 3000,
        });
        break;
    }
  };

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
              alt="Ministry of Altar Servers Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
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
        {/* Action Bar with Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('members')}
              style={{
                background: activeTab === 'members' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : '#f3f4f6'
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm"
            >
              <svg className={`w-5 h-5 ${activeTab === 'members' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab('officers')}
              style={{
                background: activeTab === 'officers' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : '#f3f4f6'
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm"
            >
              <svg className={`w-5 h-5 ${activeTab === 'officers' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              style={{
                background: activeTab === 'admins' 
                  ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                  : '#f3f4f6'
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm"
            >
              <svg className={`w-5 h-5 ${activeTab === 'admins' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleAddButtonClick}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center shadow-sm"
          >
            {getAddButtonText()}
          </button>
        </div>

        {/* Table Headers */}
        <div className="bg-gray-50 px-4 py-3 border-b-2 border-gray-200 rounded-t-lg mb-2">
          <div className={`grid gap-4 text-xs font-bold text-gray-700 uppercase tracking-wider ${
            activeTab === 'officers' ? 'grid-cols-2' : 
            activeTab === 'admins' ? 'grid-cols-3' :
            'grid-cols-4'
          }`}>
            {getTabHeaders().map((header, index) => (
              <div key={index}>{header}</div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg border-2 border-gray-100">
          {renderTabContent()}
          <div className="h-32"></div>
        </div>
      </div>

      {/* Remove Confirmation Modal - keeping original design */}
      {removeConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Remove Member</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <span className="font-semibold">
                  {removeConfirmation.member && formatMemberName(removeConfirmation.member.surname, removeConfirmation.member.givenName)}
                </span> from the ministry? This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">Warning</p>
                    <p className="text-yellow-700">This will delete all member data including attendance records and login credentials.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelRemove}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal - keeping original but with gradient header */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Member Details</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-2xl">
                    {selectedMember.surname.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {formatMemberName(selectedMember.surname, selectedMember.givenName)}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Age</p>
                    <p className="font-medium">{selectedMember.age} years old</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Service Level</p>
                    <span 
                      className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                      style={{
                        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                      }}
                    >
                      {selectedMember.serviceLevel}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Birthday</p>
                    <p className="font-medium">{new Date(selectedMember.birthdate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Years of Service</p>
                    <p className="font-medium">{selectedMember.yearsOfService} years</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Email</p>
                    <p className="font-medium">{selectedMember.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Parent Contact</p>
                    <p className="font-medium">{selectedMember.parentContact}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Address</p>
                    <p className="font-medium">{selectedMember.address}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Date Joined</p>
                    <p className="font-medium">{new Date(selectedMember.dateJoined).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Status</p>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {selectedMember.memberStatus}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    style={{
                      background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                    }}
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Edit Member
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedMember(null);
                      handleRemoveClick(selectedMember);
                    }}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Form Modal - with gradient header */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Add New Member</h2>
                <button
                  onClick={() => setShowAddMemberForm(false)}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                  disabled={submitting}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surname (Last Name) *
                </label>
                <input
                  type="text"
                  name="surname"
                  value={memberFormData.surname}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter surname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Given Name (First Name) *
                </label>
                <input
                  type="text"
                  name="givenName"
                  value={memberFormData.givenName}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter given name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={memberFormData.email}
                  onChange={handleMemberChange}
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={memberFormData.username}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={memberFormData.password}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={memberFormData.confirmPassword}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Confirm password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birthday *
                </label>
                <input
                  type="date"
                  name="birthday"
                  value={memberFormData.birthday}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                {memberFormData.birthday && (
                  <p className="text-sm text-gray-500 mt-1">
                    Age: {calculateAge(memberFormData.birthday)} years old
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={memberFormData.address}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter complete address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Contact Number *
                </label>
                <input
                  type="tel"
                  name="parentContact"
                  value={memberFormData.parentContact}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Investiture *
                </label>
                <input
                  type="date"
                  name="dateOfInvestiture"
                  value={memberFormData.dateOfInvestiture}
                  onChange={handleMemberChange}
                  required
                  disabled={submitting}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                {memberFormData.dateOfInvestiture && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">
                      Years of Service: {calculateYearsOfService(memberFormData.dateOfInvestiture)} years
                    </p>
                    <p className="text-gray-600">
                      Service Level: <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{
                          background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                        }}
                      >
                        {determineServiceLevel(calculateYearsOfService(memberFormData.dateOfInvestiture))}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Officer Form Modal - with gradient header */}
      {showAddOfficerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Appoint Officer</h2>
                <button
                  onClick={() => setShowAddOfficerForm(false)}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                  disabled={submitting}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleOfficerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member *
                </label>
                <select
                  name="memberId"
                  value={officerFormData.memberId}
                  onChange={handleOfficerChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Choose a member...</option>
                  {getAvailableMembers().map((member) => (
                    <option key={member.id} value={member.id}>
                      {formatMemberName(member.surname, member.givenName)} ({member.serviceLevel})
                    </option>
                  ))}
                </select>
                {getAvailableMembers().length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No available members (all active members are already officers)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <select
                  name="position"
                  value={officerFormData.position}
                  onChange={handleOfficerChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select position...</option>
                  {getAvailablePositions().map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                {getAvailablePositions().length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    All positions are already filled
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Appointment *
                </label>
                <input
                  type="date"
                  name="dateAppointed"
                  value={officerFormData.dateAppointed}
                  onChange={handleOfficerChange}
                  required
                  disabled={submitting}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddOfficerForm(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || getAvailableMembers().length === 0 || getAvailablePositions().length === 0}
                  style={{
                    background: (submitting || getAvailableMembers().length === 0 || getAvailablePositions().length === 0) 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Appointing...
                    </div>
                  ) : (
                    "Appoint Officer"
                  )}
                </button>
              </div>
            </form>
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