// app/admin/birthdays/page.tsx - Birthdays page for both admins and members
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface BirthdayPerson {
  id: string;
  name: string;
  birthday: string;
  age: number;
  userType: 'Admin' | 'Member';
  position?: string;
  serviceLevel?: string;
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function BirthdaysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.userType !== 'ADMIN') {
        router.push('/member/dashboard');
        return;
      }
      loadBirthdays();
    } else if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, session, router]);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/birthdays');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch birthdays');
      }
      
      const data = await response.json();
      setBirthdays(data);
    } catch (err: any) {
      console.error('Error loading birthdays:', err);
      setError(err.message || 'Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthday: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  // Filter birthdays for selected month
  const filteredBirthdays = birthdays.filter(person => {
    const birthDate = new Date(person.birthday);
    return birthDate.getMonth() === selectedMonth;
  });

  // Sort filtered birthdays by date
  const sortedFilteredBirthdays = [...filteredBirthdays].sort((a, b) => {
    const aDate = new Date(a.birthday);
    const bDate = new Date(b.birthday);
    return aDate.getDate() - bDate.getDate();
  });

  const handleBackClick = () => {
    router.push('/admin');
  };

  if (status === 'loading' || loading) {
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

      {/* White Content Card with rounded top */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">BIRTHDAYS</h2>

        {/* Month Selector - Horizontal Scroll */}
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

        {/* Celebrants List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            CELEBRANTS
          </h3>
          {sortedFilteredBirthdays.length > 0 ? (
            <div className="space-y-3">
              {sortedFilteredBirthdays.map((person) => (
                <div 
                  key={person.id} 
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                      }}
                    >
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{person.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(person.birthday).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {person.serviceLevel && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {person.serviceLevel}
                        </span>
                      )}
                      {person.position && (
                        <span className="inline-block mt-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full ml-1">
                          {person.position}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl">
                    🎂
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
              </svg>
              <p className="text-gray-500 text-lg">No birthdays in {MONTHS[selectedMonth]}</p>
            </div>
          )}
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
            className="flex flex-col items-center text-white transition-colors"
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