'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface Message {
    id: string
    content: string
    createdAt: string
    userId: string
    user: {
        id: string
        name: string
        avatar: string
        role: string
    }
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser))
        }
    }, [])

    useEffect(() => {
        fetchMessages()
        // Simple polling for a basic real-time feel if sockets aren't fully tuned for chat yet
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat')
            const data = await res.json()
            if (Array.isArray(data)) {
                setMessages(data)
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentUser) return

        setIsSending(true)
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    userId: currentUser.id,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setMessages((prev) => [...prev, data])
                setNewMessage('')
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            <DashboardHeader title="Team Chat" user={currentUser} />
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="container mx-auto px-4 py-6 flex-1 flex flex-col min-h-0">
                    <Card className="flex-1 bg-slate-900/50 backdrop-blur-xl border-white/10 flex flex-col overflow-hidden shadow-2xl">
                        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                            {/* Chat Header Info */}
                            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-200">
                                    <MessageSquare className="h-5 w-5 text-yellow-500" />
                                    <span className="font-semibold">General Discussion</span>
                                </div>
                                <span className="text-xs text-slate-400">{messages.length} messages</span>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/10">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                        <MessageSquare className="h-12 w-12 opacity-10 mb-2" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, index) => {
                                            const isMe = msg.userId === currentUser?.id
                                            const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                                >
                                                    {!isMe && showAvatar && (
                                                        <span className="text-[10px] text-slate-400 mb-1 ml-10">
                                                            {msg.user.name} • {msg.user.role}
                                                        </span>
                                                    )}
                                                    <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        {!isMe && (
                                                            <div className="w-8 h-8 flex-shrink-0">
                                                                {showAvatar ? (
                                                                    <Avatar className="h-8 w-8 border border-white/10">
                                                                        <AvatarFallback className="bg-yellow-500/10 text-yellow-500 text-[10px]">
                                                                            {msg.user.name?.split(' ').map((n: string) => n[0]).join('')}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                ) : <div className="w-8" />}
                                                            </div>
                                                        )}
                                                        <div className={`px-4 py-2 rounded-2xl text-sm ${isMe
                                                                ? 'bg-yellow-500 text-black font-medium rounded-tr-none shadow-lg shadow-yellow-500/10'
                                                                : 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none'
                                                            }`}>
                                                            {msg.content}
                                                            <div className={`text-[9px] mt-1 ${isMe ? 'text-black/60' : 'text-slate-500'}`}>
                                                                {format(new Date(msg.createdAt), 'h:mm a')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={scrollRef} />
                                    </>
                                )}
                            </div>

                            {/* Input Area */}
                            <form
                                onSubmit={handleSendMessage}
                                className="p-4 border-t border-white/5 bg-black/20 flex items-center gap-3"
                            >
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 flex-1 h-11 rounded-xl"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="h-11 w-11 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20 flex items-center justify-center p-0"
                                >
                                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
