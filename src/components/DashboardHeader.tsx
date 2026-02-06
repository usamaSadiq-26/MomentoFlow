'use client'

import { useState, useEffect } from 'react'
import { Bell, Calendar, User, MessageSquare, ArrowRight, Plus, LogIn, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DashboardHeaderProps {
    title?: string
    user: any
    tasks?: any
}

export function DashboardHeader({ title = 'MomentoFlow - Task Management Board', user, tasks = {} }: DashboardHeaderProps) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [showNotifications, setShowNotifications] = useState(false)

    const isAdmin = user?.role?.toUpperCase() === 'ADMIN'

    useEffect(() => {
        const loadNotifications = async () => {
            if (!user) return
            try {
                const response = await fetch('/api/notifications')
                const allNotifications = await response.json()

                let filteredNotifications = []
                if (isAdmin) {
                    filteredNotifications = allNotifications
                } else {
                    const tasksArray = tasks ? Object.values(tasks).flat() : []
                    filteredNotifications = allNotifications.filter((n: any) => {
                        if (!n.taskId) return n.userId === user.id
                        const relatedTask = (tasksArray as any[]).find((t: any) => t && (t as any).id === n.taskId)
                        if (!relatedTask) return false
                        return (relatedTask as any).assignedTo?.id === user.id || (relatedTask as any).createdBy?.id === user.id
                    })
                }
                setNotifications(filteredNotifications)
            } catch (error) {
                console.error('Failed to load notifications:', error)
            }
        }

        loadNotifications()
    }, [user, tasks, isAdmin])

    const unreadCount = notifications.filter((n: any) => !n.isRead).length

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'card_created': return <Calendar className="h-4 w-4 text-blue-400" />
            case 'card_assigned': return <User className="h-4 w-4 text-yellow-400" />
            case 'card_moved': return <ArrowRight className="h-4 w-4 text-amber-400" />
            case 'card_commented': return <MessageSquare className="h-4 w-4 text-emerald-400" />
            case 'attendance_update': return <Clock className="h-4 w-4 text-rose-400" />
            default: return <Bell className="h-4 w-4" />
        }
    }

    const formatNotificationTime = (date: Date | string) => {
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return d.toLocaleDateString()
    }

    return (
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 shadow-lg sticky top-0 z-10 w-full">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-sm bg-yellow-500/30 text-yellow-300 border border-yellow-500/50">
                                        {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-200">{user.name}</span>
                                    <Badge variant="secondary" className={cn(
                                        "ml-2",
                                        isAdmin ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    )}>
                                        {isAdmin ? 'Admin' : user?.role || 'User'}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/auth/login">
                                    <Button variant="outline" className="gap-2 border-slate-700/50 bg-black/30 text-slate-300 hover:bg-black/50 hover:text-white">
                                        <LogIn className="h-4 w-4" />
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold gap-2">
                                        <Plus className="h-4 w-4" />
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        )}

                        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="relative border-slate-700/50 bg-black/30 text-slate-300 hover:bg-black/50 hover:text-white"
                                >
                                    <Bell className="h-5 w-5 mr-2" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900/50 backdrop-blur-xl border border-white/10 w-80">
                                <div className="p-3 border-b border-white/10">
                                    <h3 className="font-semibold text-white">Notifications</h3>
                                </div>
                                <ScrollArea className="h-80">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.slice(0, 10).map((notification: any) => (
                                            <DropdownMenuItem
                                                key={notification.id}
                                                className="flex items-start gap-3 px-3 py-2 text-slate-200 hover:bg-yellow-500/10 hover:text-white focus:bg-yellow-500/10 focus:text-white"
                                            >
                                                {getNotificationIcon(notification.type)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">{notification.message}</p>
                                                    <p className="text-xs text-slate-500">{formatNotificationTime(notification.createdAt)}</p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 mt-1"></div>
                                                )}
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    )
}
