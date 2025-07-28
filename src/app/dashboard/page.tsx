import React from "react";

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Campfire Dashboard</h1>
      <p className="text-gray-600">Welcome to your customer support dashboard.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Conversations</h2>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Active Agents</h2>
          <p className="text-3xl font-bold text-green-600">5</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Response Time</h2>
          <p className="text-3xl font-bold text-purple-600">2.3s</p>
        </div>
      </div>
    </div>
  );
}
