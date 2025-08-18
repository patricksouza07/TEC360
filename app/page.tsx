"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Download, Bot, User, Menu, X, Trash2 } from "lucide-react"

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
  messages: Message[]
}

// Componente para formatar mensagens do bot
const FormattedMessage = ({ content }: { content: string }) => {
  const formatText = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${index}`} />)
        return
      }
      
      if (/^(🔧|👥|⏰|🛠️|🎯|🔹|🔍|❌|💡|🤖|📄|❓)/.test(line)) {
        elements.push(
          <div key={index} className="font-bold text-[#1E3A8A] mt-4 mb-2 text-base">
            {line}
          </div>
        )
      }
      else if (line.trim().startsWith('-')) {
        elements.push(
          <div key={index} className="ml-4 mb-1 flex items-start">
            <span className="text-[#1E3A8A] mr-2">•</span>
            <span className="flex-1">{line.trim().substring(1).trim()}</span>
          </div>
        )
      }
      else if (line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
        elements.push(
          <div key={index} className="font-semibold text-[#1E3A8A] mt-3 mb-2 uppercase text-sm">
            {line.trim()}
          </div>
        )
      }
      else {
        elements.push(
          <div key={index} className="mb-2 leading-relaxed">
            {line}
          </div>
        )
      }
    })
    
    return elements
  }

  return <div className="space-y-1">{formatText(content)}</div>
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
  const [currentConversationTitle, setCurrentConversationTitle] = useState("Nova Conversa")
  const [proposalHistory, setProposalHistory] = useState<ProposalHistory[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar histórico do localStorage ao iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('proposalHistory')
    if (savedHistory) {
      setProposalHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Salvar histórico no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('proposalHistory', JSON.stringify(proposalHistory))
  }, [proposalHistory])

  // Função para salvar conversa atual no histórico
  const saveCurrentConversation = () => {
    if (messages.length <= 1) return // Não salva se só tem a mensagem inicial

    const newProposal: ProposalHistory = {
      id: Date.now().toString(),
      title: currentConversationTitle,
      date: new Date().toLocaleDateString('pt-BR'),
      messages: [...messages]
    }

    setProposalHistory(prev => [newProposal, ...prev])
  }

  // Função para gerar título automático baseado na primeira resposta do bot
  const generateTitle = (botResponse: string): string => {
    const lines = botResponse.split('\n')
    for (const line of lines) {
      if (line.includes('Sistema') || line.includes('Equipamento') || line.includes('Instalação')) {
        const words = line.split(' ')
        return words.slice(0, 4).join(' ') + '...'
      }
    }
    return `Proposta ${new Date().toLocaleDateString('pt-BR')}`
  }

  // Função para carregar conversa do histórico
  const loadConversation = (proposal: ProposalHistory) => {
    setMessages(proposal.messages)
    setCurrentConversationTitle(proposal.title)
    setSidebarOpen(false) // Fecha sidebar no mobile
  }

  // Função para excluir proposta do histórico
  const deleteProposal = (proposalId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Evita abrir a conversa ao clicar no delete
    setProposalHistory(prev => prev.filter(p => p.id !== proposalId))
  }

  // Função para iniciar nova conversa
  const startNewConversation = () => {
    // Salva conversa atual antes de iniciar nova
    saveCurrentConversation()
    
    // Reset para nova conversa
    setMessages([{
      id: "1",
      content: "Olá! Sou seu assistente especializado em propostas técnicas. Anexe seu memorial descritivo e eu criarei uma proposta profissional completa para você.",
      isUser: false,
      timestamp: new Date(),
    }])
    setCurrentConversationTitle("Nova Conversa")
    setSidebarOpen(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || `Arquivo anexado: ${attachedFile?.name}`,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])

    const fileToSend = attachedFile
    setInputValue("")
    setAttachedFile(null)

    const formData = new FormData()
    formData.append("message", newMessage.content)
    formData.append("chatId", "usuario-web")
    formData.append("sessionId", "sessao-1")

    if (fileToSend) {
      formData.append("data", fileToSend, fileToSend.name)
      formData.append("fileName", fileToSend.name)
    }

    try {
      const res = await fetch("https://mlvservice.app.n8n.cloud/webhook/chatbot-TEC360", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      const aiResponseContent = json.response || "Não recebi resposta do servidor."

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        isUser: false,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, aiResponse])

      // Gera título automaticamente na primeira resposta do bot
      if (currentConversationTitle === "Nova Conversa") {
        const newTitle = generateTitle(aiResponseContent)
        setCurrentConversationTitle(newTitle)
      }
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

  // Função para exportar conversa atual como texto
  const exportCurrentConversation = () => {
    const conversationText = messages
      .map(msg => `${msg.isUser ? 'Usuário' : 'Bot'} (${msg.timestamp.toLocaleString('pt-BR')}): ${msg.content}`)
      .join('\n\n---\n\n')

    const blob = new Blob([conversationText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentConversationTitle}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
                  {message.isUser ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="text-sm">
                      <FormattedMessage content={message.content} />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
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
                    {proposalHistory.length}
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
                  <span className="text-sm text-gray-600">Conversa Atual</span>
                  <Badge variant="secondary" className="bg-[#E6F0FA] text-[#1E3A8A]">
                    {messages.length > 1 ? messages.length - 1 : 0}
                  </Badge>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={startNewConversation}
              variant="outline"
              className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#E6F0FA]"
            >
              Nova Conversa
            </Button>
            <Button
              className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white transition-all duration-200 hover:scale-105"
              onClick={exportCurrentConversation}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Proposta
            </Button>
          </div>

          {/* Proposal History */}
          <div>
            <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Histórico de Propostas</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {proposalHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma proposta salva ainda
                </p>
              ) : (
                proposalHistory.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className="p-3 cursor-pointer hover:bg-[#E6F0FA] transition-colors duration-200 group"
                    onClick={() => loadConversation(proposal)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-[#1E3A8A] mb-1 line-clamp-2">
                          {proposal.title}
                        </h4>
                        <p className="text-xs text-gray-500">{proposal.date}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {proposal.messages.length - 1} mensagens
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteProposal(proposal.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
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
