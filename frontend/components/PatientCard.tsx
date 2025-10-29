import React from "react";

interface PatientCardProps {
  name: string;
  age: number;
  lastVisit: string;
}

export default function PatientCard({ name, age, lastVisit }: PatientCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">
            {name.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{name}</h3>
      <div className="space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium">Age:</span> {age}
        </p>
        <p>
          <span className="font-medium">Last Visit:</span> {lastVisit}
        </p>
      </div>
    </div>
  );
}
