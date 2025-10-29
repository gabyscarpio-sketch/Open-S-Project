"use client";

import { useState, useEffect } from "react";

interface Patient {
  id: number;
  name: string;
  age: number;
  lastVisit: string;
}

interface PatientSearchBarProps {
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientSearchBar({ onSelectPatient }: PatientSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const [showResults, setShowResults] = useState(false);

  const mockPatients: Patient[] = [
    { id: 123, name: "John Doe", age: 45, lastVisit: "2025-10-15" },
    { id: 124, name: "Jane Smith", age: 32, lastVisit: "2025-10-20" },
    { id: 125, name: "Bob Johnson", age: 58, lastVisit: "2025-10-22" },
    { id: 126, name: "María García", age: 41, lastVisit: "2025-10-18" },
    { id: 127, name: "Carlos López", age: 29, lastVisit: "2025-10-25" },
  ];

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const filtered = mockPatients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filtered);
      setShowResults(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectPatient = (patient: Patient) => {
    onSelectPatient(patient);
    setSearchTerm("");
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar paciente por nombre..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
        />
      </div>

      {isSearching && (
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          <svg
            className="animate-spin h-4 w-4 mr-2 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Buscando...
        </div>
      )}

      {showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-600 font-medium">
                No se encontraron pacientes con ese nombre
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Intenta con otro término de búsqueda
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {results.map((patient) => (
                <li
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">
                        {patient.age} años • Última visita: {patient.lastVisit}
                      </p>
                    </div>
                    <div className="text-indigo-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
