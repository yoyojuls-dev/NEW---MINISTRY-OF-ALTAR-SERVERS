// app/admin/login/page.tsx - Updated with fixed Image component
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect if already logged in as admin
    if (status === "authenticated" && session?.user?.userType === "ADMIN") {
      router.push("/admin");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        userType: "ADMIN",
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success("Login successful!");
        router.push("/admin");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo Section - Fixed with sizes prop */}
        <div className="text-center mb-8">
          <div className="relative w-48 h-32 mx-auto mb-4">
            <Image
              src="/images/MAS LOGO.png"
              alt="Ministry of Altar Servers Logo"
              fill
              sizes="(max-width: 768px) 192px, 192px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-center">
            <h2 className="text-white text-xl font-semibold">Login as Administrator</h2>
          </div>

          {/* Form */}
          <div className="px-8 py-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Username or Email"
                  required
                  className="w-full px-4 py-4 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className="w-full px-4 py-4 pr-12 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.757 7.757m13.486 13.486L18.121 18.121m3.172-3.172l-3.172 3.172m0 0L12 12m6.121 6.121L12 12m6.121 6.121l3.172 3.172" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-900 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center">
              <Link 
                href="/admin/forgot-password" 
                className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">Or</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <Link 
                href="/admin/register" 
                className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
              >
                Create New Admin Account
              </Link>
            </div>
          </div>
        </div>

        {/* Member Login Link */}
        <div className="mt-6 text-center">
          <Link 
            href="/member/login" 
            className="text-white/80 text-sm hover:text-white transition-colors"
          >
            → Member Login Portal
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-2 text-center">
          <Link 
            href="/" 
            className="text-white/60 text-xs hover:text-white/80 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}