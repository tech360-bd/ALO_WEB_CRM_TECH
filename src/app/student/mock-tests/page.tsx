import React from 'react';
import { Metadata } from 'next';
import StudentPortalShell from '@/components/student/StudentPortalShell';

export const metadata: Metadata = {
  title: 'Mock Tests | ALO Education Student Portal',
  description: 'Practice IELTS, PTE, Duolingo mock tests with AI scoring and expert feedback.',
};

export default function StudentMockTestsPage() {
  return (
    <StudentPortalShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Mock Tests</h1>
        <p className="text-gray-500 mb-6">Practice English proficiency tests with AI-powered scoring.</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'IELTS Mock Test', tests: 12, completed: 3, color: 'bg-blue-600' },
            { name: 'PTE Academic Mock', tests: 8, completed: 1, color: 'bg-green-600' },
            { name: 'Duolingo Practice', tests: 15, completed: 5, color: 'bg-purple-600' },
          ].map((item) => (
            <div key={item.name} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
              <div className={`w-12 h-12 ${item.color} rounded-lg mb-4 flex items-center justify-center text-white font-bold`}>
                {item.name.charAt(0)}
              </div>
              <h3 className="font-bold mb-2">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{item.tests} tests • {item.completed} completed</p>
              <a href="/student/mock-tests/available" className="block w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-black text-center">
                Start Practice
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> You have 3 free mock test vouchers. Complete your profile and submit an application to earn more vouchers.
            Visit <a href="/student/mock-tests/available" className="underline">Student Portal Mock Tests</a> for full access.
          </p>
        </div>
      </div>
    </StudentPortalShell>
  );
}
