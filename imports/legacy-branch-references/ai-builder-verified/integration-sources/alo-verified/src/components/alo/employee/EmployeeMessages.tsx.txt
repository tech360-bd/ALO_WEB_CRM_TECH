'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  MessageSquare, Send, Search, Plus, User, Clock,
  ChevronLeft, Users
} from 'lucide-react'

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantRole: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  messages: Message[]
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isFromMe: boolean
}

interface StaffMember {
  id: string
  name: string
  role: string
  department?: string
}

const mockStaff: StaffMember[] = [
  { id: 'emp-1', name: 'Sarah Johnson', role: 'Senior Counselor', department: 'Counseling' },
  { id: 'emp-2', name: 'Michael Chen', role: 'Admissions Manager', department: 'Admissions' },
  { id: 'emp-3', name: 'Emily Wright', role: 'Visa Specialist', department: 'Visa' },
  { id: 'emp-4', name: 'David Brown', role: 'Partner Relations', department: 'Partnerships' },
  { id: 'emp-5', name: 'Lisa Taylor', role: 'Marketing Lead', department: 'Marketing' },
  { id: 'emp-6', name: 'James Wilson', role: 'HR Manager', department: 'HR' },
  { id: 'emp-7', name: 'Anna Martinez', role: 'Finance Officer', department: 'Finance' },
]

// Conversations are now fetched from the API

export default function EmployeeMessages() {
  const { currentUser } = useAppStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [mobileShowThread, setMobileShowThread] = useState(false)

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true)
        const userId = currentUser?.id || ''
        const res = await fetch(`/api/messages?userId=${userId}&limit=50`)
        if (res.ok) {
          const json = await res.json()
          const msgs = json.messages || []
          const convMap = new Map<string, Conversation>()
          msgs.forEach((m: any) => {
            const otherId = m.senderId === userId ? m.recipientId : m.senderId
            if (!otherId) return
            if (!convMap.has(otherId)) {
              convMap.set(otherId, {
                id: `conv-${otherId}`,
                participantId: otherId,
                participantName: m.senderId === userId ? (m.recipientName || 'Colleague') : (m.senderName || 'Colleague'),
                participantRole: m.senderRole || m.recipientRole || 'Staff',
                lastMessage: m.body || m.subject || '',
                lastMessageTime: m.createdAt || '',
                unread: m.isRead ? 0 : 1,
                messages: [],
              })
            }
            const conv = convMap.get(otherId)!
            conv.messages.push({
              id: m.id,
              senderId: m.senderId || '',
              senderName: m.senderId === userId ? (currentUser?.name || 'Me') : (m.senderName || 'Colleague'),
              content: m.body || m.subject || '',
              timestamp: m.createdAt || '',
              isFromMe: m.senderId === userId,
            })
          })
          setConversations(Array.from(convMap.values()))
        }
      } catch {
        setConversations([])
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [currentUser?.id])

  const filteredConversations = conversations.filter(c =>
    !search || c.participantName.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return
    const msg: Message = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      senderName: currentUser?.name || 'Me',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isFromMe: true,
    }
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConversation.id) {
        return { ...c, messages: [...c.messages, msg], lastMessage: msg.content, lastMessageTime: msg.timestamp }
      }
      return c
    }))
    setSelectedConversation(prev => {
      if (!prev) return null
      return { ...prev, messages: [...prev.messages, msg], lastMessage: msg.content, lastMessageTime: msg.timestamp }
    })
    setNewMessage('')
    toast.success('Message sent')
  }

  const handleComposeSend = () => {
    if (!composeRecipient || !composeMessage.trim()) return
    setSending(true)
    const staff = mockStaff.find(s => s.id === composeRecipient)
    if (!staff) { setSending(false); return }

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      participantId: composeRecipient,
      participantName: staff.name,
      participantRole: staff.role,
      lastMessage: composeMessage.trim(),
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      messages: [{
        id: `m-${Date.now()}`,
        senderId: 'me',
        senderName: currentUser?.name || 'Me',
        content: composeMessage.trim(),
        timestamp: new Date().toISOString(),
        isFromMe: true,
      }],
    }
    setConversations(prev => [newConv, ...prev])
    setSelectedConversation(newConv)
    setMobileShowThread(true)
    setShowCompose(false)
    setComposeRecipient('')
    setComposeMessage('')
    setSending(false)
    toast.success('Message sent')
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setMobileShowThread(true)
    setConversations(prev => prev.map(c => {
      if (c.id === conv.id) return { ...c, unread: 0 }
      return c
    }))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Yesterday'
    if (days < 7) return date.toLocaleDateString('en', { weekday: 'short' })
    return date.toLocaleDateString('en', { day: 'numeric', month: 'short' })
  }

  const formatMessageTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatMessageDate = (timestamp: string) => new Date(timestamp).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Internal Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'No unread messages'}
          </p>
        </div>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <Button className="bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Message
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Select Colleague</Label>
                <Select value={composeRecipient} onValueChange={setComposeRecipient}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a colleague" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStaff.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Message</Label>
                <Textarea className="mt-1 min-h-[120px]" placeholder="Type your message..." value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                <Button onClick={handleComposeSend} disabled={!composeRecipient || !composeMessage.trim() || sending}
                  className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                  <Send className="h-4 w-4 mr-2" /> {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages Layout */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversation List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${
            mobileShowThread ? 'hidden md:flex' : 'flex'
          }`}>
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No conversations</p>
                  <Button size="sm" className="mt-3 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCompose(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Start New
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-[#F37021]/5 border-l-2 border-l-[#F37021]' : ''
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#0066CC] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">
                            {conv.participantName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-[#1A2332] truncate">{conv.participantName}</p>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatTime(conv.lastMessageTime)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{conv.participantRole}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                        {conv.unread > 0 && (
                          <Badge className="bg-[#F37021] text-white text-[10px] h-5 min-w-5 flex items-center justify-center shrink-0">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Message Thread */}
          <div className={`flex-1 flex flex-col ${mobileShowThread ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileShowThread(false)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-9 h-9 bg-[#0066CC] rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {selectedConversation.participantName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2332]">{selectedConversation.participantName}</p>
                    <p className="text-xs text-gray-500">{selectedConversation.participantRole}</p>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg, idx) => {
                      const prevMsg = idx > 0 ? selectedConversation.messages[idx - 1] : null
                      const showDate = !prevMsg || formatMessageDate(msg.timestamp) !== formatMessageDate(prevMsg.timestamp)
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center gap-3 my-4">
                              <Separator className="flex-1" />
                              <span className="text-[10px] text-gray-400 shrink-0">{formatMessageDate(msg.timestamp)}</span>
                              <Separator className="flex-1" />
                            </div>
                          )}
                          <div className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] ${
                              msg.isFromMe
                                ? 'bg-[#0066CC] text-white rounded-2xl rounded-br-sm'
                                : 'bg-gray-100 text-[#1A2332] rounded-2xl rounded-bl-sm'
                            } px-4 py-2.5`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${msg.isFromMe ? 'text-white/70' : 'text-gray-400'}`}>
                                {formatMessageTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                      className="flex-1" />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-[#0066CC] hover:bg-[#0066CC]/90 text-white shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-16 w-16 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 font-medium">Select a conversation</p>
                  <p className="text-xs text-gray-400 mt-1">Choose from your existing conversations or start a new one</p>
                  <Button className="mt-4 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCompose(true)}>
                    <Plus className="h-4 w-4 mr-2" /> New Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
