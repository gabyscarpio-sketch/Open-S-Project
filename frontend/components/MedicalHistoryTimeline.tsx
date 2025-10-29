"use client";

import { useState } from "react";

interface MedicalEvent {
  id: number;
  date: string;
  type: "cardiology" | "prescription" | "lab" | "general";
  title: string;
  description: string;
}

interface MedicalHistoryTimelineProps {
  patientId: number;
}

export default function MedicalHistoryTimeline({ patientId }: MedicalHistoryTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

  const mockEvents: MedicalEvent[] = [
    {
      id: 1,
      date: "2025-10-22",
      type: "cardiology",
      title: "Consulta Cardiología",
      description:
        "Paciente presenta hipertensión controlada. Se recomienda continuar con medicación actual. Presión arterial: 130/85 mmHg. Frecuencia cardíaca: 72 lpm. ECG normal. Se solicitan análisis de seguimiento para próxima consulta en 3 meses.",
    },
    {
      id: 2,
      date: "2025-10-15",
      type: "lab",
      title: "Resultados de Laboratorio",
      description:
        "Análisis de sangre completo. Hemoglobina: 14.2 g/dL. Glucosa: 95 mg/dL. Colesterol total: 185 mg/dL. HDL: 52 mg/dL. LDL: 110 mg/dL. Triglicéridos: 115 mg/dL. Función renal normal. Valores dentro de rangos normales.",
    },
    {
      id: 3,
      date: "2025-09-28",
      type: "prescription",
      title: "Nueva Prescripción",
      description:
        "Atorvastatina 20mg, tomar 1 comprimido por la noche. Duración: 3 meses con posibilidad de renovación.",
    },
    {
      id: 4,
      date: "2025-09-10",
      type: "general",
      title: "Consulta General",
      description: "Chequeo rutinario anual. Estado general bueno. Sin novedades significativas.",
    },
  ];

  const toggleExpand = (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "cardiology":
        return (
          <div className="bg-red-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case "prescription":
        return (
          <div className="bg-blue-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case "lab":
        return (
          <div className="bg-purple-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Historial Médico</h3>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {mockEvents.map((event, index) => {
            const isExpanded = expandedEvents.has(event.id);
            const needsTruncation = event.description.length > 100;

            return (
              <div key={event.id} className="relative pl-16">
                <div className="absolute left-0">{getEventIcon(event.type)}</div>
                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-indigo-600">{event.date}</p>
                      <h4 className="text-lg font-bold text-gray-800">{event.title}</h4>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {isExpanded ? event.description : truncateText(event.description)}
                  </p>
                  {needsTruncation && (
                    <button
                      onClick={() => toggleExpand(event.id)}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          Ver menos
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Ver más
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
