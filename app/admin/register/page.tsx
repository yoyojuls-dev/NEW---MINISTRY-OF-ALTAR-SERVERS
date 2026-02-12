// app/admin/register/page.tsx - Fixed version with proper Image sizes
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "",
    contactNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Sending registration request...");
      
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          position: formData.position,
          contactNumber: formData.contactNumber,
        }),
      });

      const data = await response.json();
      console.log("Response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `Registration failed: ${response.status}`);
      }

      toast.success("Admin account created successfully!");
      console.log("Registration successful, redirecting...");
      router.push("/admin/login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
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

        {/* Registration Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-center">
            <h2 className="text-white text-xl font-semibold">Create Admin Account</h2>
            <p className="text-blue-100 text-sm mt-1">Ministry Administrator Registration</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Position Input */}
              <div>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Position (e.g., Ministry Coordinator)"
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Contact Number Input */}
              <div>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Contact Number"
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password (min. 6 characters)"
                  required
                  className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
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

              {/* Confirm Password Input */}
              <div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-900 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link 
                  href="/admin/login" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-white/80 text-sm hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}