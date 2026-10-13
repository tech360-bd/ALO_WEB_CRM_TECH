'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  MessageSquare, Send, Inbox, PenSquare, Search,
  User, Clock, Paperclip, ChevronLeft, Plus, Reply
} from 'lucide-react'

interface Message {
  id: string
  subject: string
  body: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  isRead: boolean
  createdAt: string
  priority: string
  category: string
}

export default function StudentMessages() {
  const { currentUser } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inbox')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true)
        const userId = currentUser?.id || ''
        const res = await fetch(`/api/messages?userId=${userId}&limit=50`)
        if (!res.ok) throw new Error('Failed to load messages')
        const json = await res.json()
        setMessages(json.messages || json || [])
      } catch {
        setMessages([])
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [currentUser?.id])

  const inboxMessages = messages.filter(m => m.recipientId === currentUser?.id)
  const sentMessages = messages.filter(m => m.senderId === currentUser?.id)
  const unreadCount = inboxMessages.filter(m => !m.isRead).length

  const filteredMessages = (activeTab === 'inbox' ? inboxMessages : sentMessages).filter(m =>
    !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.body.toLowerCase().includes(search.toLowerCase())
  )

  const handleCompose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    try {
      const formData = new FormData(e.currentTarget)
      const body = {
        recipientId: formData.get('recipientId') || '',
        subject: formData.get('subject') || '',
        body: formData.get('body') || '',
        senderId: currentUser?.id || '',
        category: formData.get('category') || 'general',
        priority: formData.get('priority') || 'normal',
      }
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to send message')
      toast.success('Message sent successfully')
      setShowCompose(false)
      const json = await res.json()
      setMessages(prev => [json, ...prev])
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedMessage.senderId,
          subject: `Re: ${selectedMessage.subject}`,
          body: replyText,
          senderId: currentUser?.id || '',
          category: selectedMessage.category,
          priority: 'normal',
        }),
      })
      if (!res.ok) throw new Error('Failed to send reply')
      toast.success('Reply sent')
      setReplyText('')
    } catch {
      toast.error('Failed to send reply')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  // Message detail view
  if (selectedMessage) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => setSelectedMessage(null)} className="text-gray-500">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Messages
        </Button>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-alo-navy">{selectedMessage.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{selectedMessage.category}</Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedMessage.priority === 'high' && (
                <Badge className="bg-red-50 text-red-700 text-xs">High Priority</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-alo-blue/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-alo-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-alo-navy">{selectedMessage.senderName}</p>
                <p className="text-xs text-gray-500">{selectedMessage.senderRole}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 mb-6 whitespace-pre-wrap">
              {selectedMessage.body}
            </div>
            <div className="border-t pt-4">
              <Label className="text-xs text-gray-500">Reply</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder="Type your reply..."
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleReply} disabled={!replyText.trim()} className="bg-alo-orange hover:bg-alo-orange/90 text-white">
                  <Reply className="h-4 w-4 mr-2" /> Send Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'No unread messages'}
          </p>
        </div>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogTrigger asChild>
            <Button className="bg-alo-orange hover:bg-alo-orange/90 text-white">
              <PenSquare className="h-4 w-4 mr-2" /> Compose
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCompose} className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">To (Counselor ID)</Label>
                <Input name="recipientId" className="mt-1" placeholder="Enter recipient ID" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Subject</Label>
                <Input name="subject" className="mt-1" placeholder="Message subject" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Category</Label>
                <Select name="category" defaultValue="general">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Message</Label>
                <Textarea name="body" className="mt-1 min-h-[120px]" placeholder="Write your message..." required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                <Button type="submit" disabled={sending} className="bg-alo-orange hover:bg-alo-orange/90 text-white">
                  <Send className="h-4 w-4 mr-2" /> {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="inbox" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <Inbox className="h-3.5 w-3.5 mr-1.5" />
            Inbox {unreadCount > 0 && <Badge className="ml-1.5 bg-alo-orange text-white text-[10px] h-4 min-w-4">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-white data-[state=active]:text-alo-orange">
            <Send className="h-3.5 w-3.5 mr-1.5" /> Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredMessages.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No messages</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === 'inbox' ? 'Your inbox is empty' : 'No sent messages'}
                </p>
                {activeTab === 'inbox' && (
                  <Button className="mt-4 bg-alo-orange hover:bg-alo-orange/90 text-white"
                    onClick={() => setShowCompose(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Start Conversation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((msg) => (
                <Card
                  key={msg.id}
                  className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${
                    !msg.isRead && activeTab === 'inbox' ? 'bg-alo-orange/[0.03] border-l-2 border-l-alo-orange' : ''
                  }`}
                  onClick={() => setSelectedMessage(msg)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-alo-blue/10 rounded-full flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-alo-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!msg.isRead && activeTab === 'inbox' ? 'font-semibold text-alo-navy' : 'text-gray-700'}`}>
                          {activeTab === 'inbox' ? msg.senderName : msg.recipientName}
                        </p>
                        {msg.priority === 'high' && (
                          <Badge className="bg-red-50 text-red-600 text-[10px] shrink-0">Urgent</Badge>
                        )}
                      </div>
                      <p className={`text-sm truncate ${!msg.isRead && activeTab === 'inbox' ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{msg.body.slice(0, 80)}...</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
