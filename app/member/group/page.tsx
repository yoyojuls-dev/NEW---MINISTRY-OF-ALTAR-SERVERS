// app/member/group/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

interface Member {
  id: string;
  surname: string;
  givenName: string;
  serverLevel?: string;
}

interface Group {
  id: string;
  name: string;
  leader?: Member;
  members: Member[];
  isMyGroup: boolean;
}

export default function MemberGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [otherGroups, setOtherGroups] = useState<Group[]>([]);
  const [memberProfile, setMemberProfile] = useState<Member | null>(null);

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
      fetchGroups();
    }
  }, [session, status, router]);

  const fetchMemberProfile = async () => {
    try {
      const response = await fetch('/api/member/profile');
      if (response.ok) {
        const data = await response.json();
        setMemberProfile({
          id: data.id,
          surname: data.surname,
          givenName: data.givenName,
          serverLevel: data.serverLevel,
        });
      }
    } catch (error) {
      console.error('Error fetching member profile:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/member/groups');
      
      if (response.ok) {
        const data = await response.json();
        setMyGroup(data.myGroup);
        setOtherGroups(data.otherGroups || []);
      } else {
        // Load sample data for demonstration
        loadSampleData();
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      loadSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    // Sample data for demonstration
    const sampleMyGroup: Group = {
      id: "1",
      name: "Morning Team",
      leader: {
        id: "leader1",
        surname: "Santos",
        givenName: "Maria",
        serverLevel: "MASTER",
      },
      members: [
        { id: "m1", surname: "Dela Cruz", givenName: "Juan", serverLevel: "SENIOR" },
        { id: "m2", surname: "Reyes", givenName: "Pedro", serverLevel: "SENIOR" },
        { id: "m3", surname: "Garcia", givenName: "Ana", serverLevel: "JUNIOR" },
        { id: "m4", surname: "Lopez", givenName: "Carlos", serverLevel: "JUNIOR" },
      ],
      isMyGroup: true,
    };

    const sampleOtherGroups: Group[] = [
      {
        id: "2",
        name: "Evening Team",
        leader: {
          id: "leader2",
          surname: "Cruz",
          givenName: "Jose",
          serverLevel: "MASTER",
        },
        members: [
          { id: "m5", surname: "Ramos", givenName: "Sofia", serverLevel: "SENIOR" },
          { id: "m6", surname: "Torres", givenName: "Miguel", serverLevel: "SENIOR" },
          { id: "m7", surname: "Flores", givenName: "Isabel", serverLevel: "JUNIOR" },
        ],
        isMyGroup: false,
      },
      {
        id: "3",
        name: "Youth Group",
        leader: {
          id: "leader3",
          surname: "Mendoza",
          givenName: "Gabriel",
          serverLevel: "MASTER",
        },
        members: [
          { id: "m8", surname: "Castillo", givenName: "Luis", serverLevel: "JUNIOR" },
          { id: "m9", surname: "Morales", givenName: "Carmen", serverLevel: "JUNIOR" },
          { id: "m10", surname: "Ortiz", givenName: "Diego", serverLevel: "JUNIOR" },
          { id: "m11", surname: "Rivera", givenName: "Elena", serverLevel: "JUNIOR" },
          { id: "m12", surname: "Gomez", givenName: "Marco", serverLevel: "JUNIOR" },
        ],
        isMyGroup: false,
      },
    ];

    setMyGroup(sampleMyGroup);
    setOtherGroups(sampleOtherGroups);
  };

  const formatMemberName = (member: Member) => {
    return `${member.surname}, ${member.givenName}`;
  };

  const getServerLevelBadgeColor = (level?: string) => {
    switch (level) {
      case 'MASTER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SENIOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'JUNIOR':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleBackClick = () => {
    router.push('/member/dashboard');
  };

  if (status === "loading" || isLoading) {
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

      {/* White Content Area */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">MY GROUP</h2>

        {/* My Assigned Group */}
        {myGroup ? (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-hidden">
              {/* Group Header */}
              <div 
                className="px-6 py-4"
                style={{
                  background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{myGroup.name}</h3>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-white">
                    My Group
                  </span>
                </div>
              </div>

              {/* Group Leader */}
              {myGroup.leader && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-orange-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424z" clipRule="evenodd" />
                          <path d="M6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 101.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 013.095 2.348.75.75 0 00.992 0 26.547 26.547 0 015.93-3.95.75.75 0 00.42-.739 41.053 41.053 0 00-.39-3.114 29.925 29.925 0 00-5.199 2.801 2.25 2.25 0 01-2.514 0c-.41-.275-.826-.541-1.25-.797a6.985 6.985 0 01-1.084-.63z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-orange-600 uppercase">Group Leader</p>
                        <p className="font-bold text-gray-900">{formatMemberName(myGroup.leader)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getServerLevelBadgeColor(myGroup.leader.serverLevel)}`}>
                      {myGroup.leader.serverLevel}
                    </span>
                  </div>
                </div>
              )}

              {/* Group Members */}
              <div className="p-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-3">
                  Members ({myGroup.members.length})
                </h4>
                <div className="space-y-2">
                  {myGroup.members.map((member, index) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatMemberName(member)}
                        </span>
                      </div>
                      {member.serverLevel && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getServerLevelBadgeColor(member.serverLevel)}`}>
                          {member.serverLevel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-12 text-center bg-gray-50 rounded-xl border-2 border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">You are not assigned to any group yet</p>
          </div>
        )}

        {/* Other Groups */}
        {otherGroups.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">OTHER GROUPS</h3>
            
            <div className="space-y-4">
              {otherGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden">
                  {/* Group Header */}
                  <div className="bg-gray-50 px-6 py-3 border-b-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                      <span className="bg-gray-200 px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>

                  {/* Group Leader */}
                  {group.leader && (
                    <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424z" clipRule="evenodd" />
                              <path d="M6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 101.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 013.095 2.348.75.75 0 00.992 0 26.547 26.547 0 015.93-3.95.75.75 0 00.42-.739 41.053 41.053 0 00-.39-3.114 29.925 29.925 0 00-5.199 2.801 2.25 2.25 0 01-2.514 0c-.41-.275-.826-.541-1.25-.797a6.985 6.985 0 01-1.084-.63z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600">Leader</p>
                            <p className="text-sm font-bold text-gray-900">{formatMemberName(group.leader)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getServerLevelBadgeColor(group.leader.serverLevel)}`}>
                          {group.leader.serverLevel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {group.members.map((member, index) => (
                        <div 
                          key={member.id}
                          className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-5">
                              {index + 1}.
                            </span>
                            <span className="text-sm text-gray-900">
                              {formatMemberName(member)}
                            </span>
                          </div>
                          {member.serverLevel && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getServerLevelBadgeColor(member.serverLevel)}`}>
                              {member.serverLevel}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
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