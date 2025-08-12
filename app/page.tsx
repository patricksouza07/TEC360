"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Download, Bot, User, Menu, X } from "lucide-react"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface ProposalHistory {
  id: string
  title: string
  date: string
}

export default function TechnicalProposalChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Olá! Sou seu assistente especializado em propostas técnicas. Anexe seu memorial descritivo e eu criarei uma proposta profissional completa para você.",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const proposalHistory: ProposalHistory[] = [
    { id: "1", title: "Sistema de Automação Industrial", date: "15/01/2024" },
    { id: "2", title: "Infraestrutura de Rede Corporativa", date: "12/01/2024" },
    { id: "3", title: "Plataforma de E-commerce", date: "08/01/2024" },
  ]

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || `Arquivo anexado: ${attachedFile?.name}`,
      isUser: true,
      timestamp: new Date(),
    }

    // Atualiza a UI com a mensagem do usuário
    setMessages((prev) => [...prev, newMessage])

    // Salva a referência do arquivo antes de limpar o estado
    const fileToSend = attachedFile

    // Limpa input e arquivo
    setInputValue("")
    setAttachedFile(null)

    // Monta FormData para enviar via fetch
    const formData = new FormData()
    formData.append("message", newMessage.content)
    formData.append("chatId", "usuario-web")
    formData.append("sessionId", "sessao-1")

    if (fileToSend) {
      formData.append("data", fileToSend, fileToSend.name)
      formData.append("fileName", fileToSend.name)
    }

    try {
      // Substitua abaixo pela URL do seu webhook no n8n
      const res = await fetch("https://mlvservice.app.n8n.cloud/webhook-test/chatbot-TEC360", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      // Ajuste 'json.response' para o campo correto que seu webhook retornar
      const aiResponseContent = json.response || "Não recebi resposta do servidor."

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error("Erro ao chamar webhook:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Erro ao enviar mensagem. Tente novamente.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAttachedFile(file)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-[#E6F0FA]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1E3A8A]">Agente IA - Proposta Técnica</h1>
          </div>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col pt-16 pb-20 md:mr-80">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-500`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`flex items-start space-x-3 max-w-[80%] ${message.isUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isUser ? "bg-[#BFDBFE]" : "bg-[#1E3A8A]"
                  }`}
                >
                  {message.isUser ? (
                    <User className="w-4 h-4 text-[#1E3A8A]" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.isUser ? "bg-[#BFDBFE] text-gray-900" : "bg-white text-[#1E3A8A] border border-gray-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:right-80 bg-white border-t border-gray-200 p-4">
        {attachedFile && (
          <div className="mb-3 p-2 bg-[#E6F0FA] rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-sm text-[#1E3A8A]">{attachedFile.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAttachedFile(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#E6F0FA]"
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Anexar Memorial</span>
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 border-gray-300 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white transition-all duration-200 hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Right Sidebar */}
      <div
        className={`fixed top-16 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 z-40`}
      >
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div>
            <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Estatísticas</h3>
            <div className="space-y-3">
              <Card className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Propostas Geradas</span>
                  <Badge variant="secondary" className="bg-[#E6F0FA] text-[#1E3A8A]">
                    247
                  </Badge>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tempo Médio</span>
                  <Badge variant="secondary" className="bg-[#E6F0FA] text-[#1E3A8A]">
                    2.3min
                  </Badge>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Últimos Clientes</span>
                  <Badge variant="secondary" className="bg-[#E6F0FA] text-[#1E3A8A]">
                    15
                  </Badge>
                </div>
              </Card>
            </div>
          </div>

          {/* Export Button */}
          <div>
            <Button
              className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white transition-all duration-200 hover:scale-105"
              onClick={() => alert("Exportando proposta como PDF...")}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Proposta
            </Button>
          </div>

          {/* Proposal History */}
          <div>
            <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Histórico de Propostas</h3>
            <div className="space-y-2">
              {proposalHistory.map((proposal) => (
                <Card
                  key={proposal.id}
                  className="p-3 cursor-pointer hover:bg-[#E6F0FA] transition-colors duration-200"
                  onClick={() => alert(`Abrindo proposta: ${proposal.title}`)}
                >
                  <h4 className="text-sm font-medium text-[#1E3A8A] mb-1">{proposal.title}</h4>
                  <p className="text-xs text-gray-500">{proposal.date}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
