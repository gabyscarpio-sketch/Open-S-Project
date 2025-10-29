"use client";

import { useState, useEffect, useRef } from "react";
import PatientCard from "@/components/PatientCard";
import PatientSearchBar from "@/components/PatientSearchBar";
import MedicalHistoryTimeline from "@/components/MedicalHistoryTimeline";
import Toast from "@/components/Toast";
import TypingIndicator from "@/components/TypingIndicator";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface Patient {
  id: number;
  name: string;
  age: number;
  lastVisit: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient>({
    id: 123,
    name: "John Doe",
    age: 45,
    lastVisit: "2025-10-15",
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const copyToClipboard = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageIndex);
      addToast("Mensaje copiado al portapapeles", "success");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      addToast("Error al copiar el mensaje", "error");
    }
  };

  const streamText = (text: string, messageIndex: number) => {
    let currentIndex = 0;
    const words = text.split(" ");

    const intervalId = setInterval(() => {
      if (currentIndex < words.length) {
        const currentText = words.slice(0, currentIndex + 1).join(" ");
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: currentText,
            isStreaming: true,
          };
          return newMessages;
        });
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            isStreaming: false,
          };
          return newMessages;
        });
      }
    }, 50);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/assistant/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          prompt_text: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessageIndex = messages.length + 1;
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      streamText(data.response, assistantMessageIndex);
      addToast("Respuesta recibida", "success");
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      addToast("Error al comunicarse con el asistente", "error");
      const errorMessage: Message = {
        role: "assistant",
        content: "Lo siento, encontré un error. Por favor, intenta de nuevo.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    addToast(`Paciente seleccionado: ${patient.name}`, "info");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-6 mt-8">
          Asistente Médico con IA
        </h1>

        <div className="mb-6">
          <PatientSearchBar onSelectPatient={handleSelectPatient} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="bg-indigo-600 text-white p-4">
                <h2 className="text-xl font-semibold">Chat con Asistente</h2>
                <p className="text-sm text-indigo-100">
                  Paciente: {selectedPatient.name} (ID: {selectedPatient.id})
                </p>
              </div>

              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-16 w-16 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">
                      Bienvenido al Asistente Médico con IA
                    </p>
                    <p className="text-sm mt-2">
                      Pregunta cualquier cosa sobre tus preocupaciones de salud
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`group relative max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-800 shadow-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.role === "assistant" && !message.isStreaming && (
                          <button
                            onClick={() => copyToClipboard(message.content, index)}
                            className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700"
                            title="Copiar al portapapeles"
                          >
                            {copiedMessageId === index ? (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 p-4 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputText.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
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
                        Enviando...
                      </>
                    ) : (
                      "Enviar"
                    )}
                  </button>
                </form>
              </div>
            </div>

            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="mt-4 w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {showTimeline ? "Ocultar" : "Ver"} Historial Médico
              <svg
                className={`h-5 w-5 transition-transform ${
                  showTimeline ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showTimeline && (
              <div className="mt-4 animate-fade-in">
                <MedicalHistoryTimeline patientId={selectedPatient.id} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Pacientes Recientes</h3>
            <PatientCard name="John Doe" age={45} lastVisit="2025-10-15" />
            <PatientCard name="Jane Smith" age={32} lastVisit="2025-10-20" />
            <PatientCard name="Bob Johnson" age={58} lastVisit="2025-10-22" />
          </div>
        </div>
      </div>
    </div>
  );
}
