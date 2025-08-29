'use client'

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email: e.target.email.value,
      password: e.target.password.value,
    });

    if (res?.ok) router.push('/admin');
    else setError('Invalid email or password');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto bg-white shadow-md rounded-2xl p-6 space-y-5"
    >
      <h1 className="text-2xl font-semibold text-center text-gray-800">
        Admin Login
      </h1>

      <div className="space-y-4">
        <input
          name="email"
          placeholder="Email"
          required
          type="email"
          className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition"
      >
        Login
      </button>

      {error && (
        <p className="text-center text-sm text-red-600 font-medium">{error}</p>
      )}
    </form>
  );
}
