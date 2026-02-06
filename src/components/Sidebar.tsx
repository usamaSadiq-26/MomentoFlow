'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SquareKanban, Users, LogOut, Clock, ShieldCheck, UserCheck, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userRole, setUserRole] = useState<string | null>(null)
    const [unreadChatCount, setUnreadChatCount] = useState(0)

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            setUserRole(JSON.parse(savedUser).role)
        }

        // Fetch unread chat count
        const fetchUnread = async () => {
            const lastVisit = localStorage.getItem('lastChatVisit') || new Date(0).toISOString()
            try {
                const res = await fetch(`/api/chat/unread?since=${lastVisit}`)
                const data = await res.json()
                setUnreadChatCount(data.count || 0)
            } catch (error) {
                console.error('Failed to fetch unread count:', error)
            }
        }

        fetchUnread()
        const interval = setInterval(fetchUnread, 10000)

        // Clear count if we are on the chat page
        if (pathname === '/chat') {
            localStorage.setItem('lastChatVisit', new Date().toISOString())
            setUnreadChatCount(0)
        }

        return () => clearInterval(interval)
    }, [pathname])

    const handleLogout = () => {
        localStorage.removeItem('user')
        router.replace('/auth/login')
    }

    const links = [
        {
            href: '/',
            label: 'Task Board',
            icon: SquareKanban,
            active: pathname === '/',
            show: true,
        },
        {
            href: '/attendance',
            label: 'Attendance',
            icon: Clock,
            active: pathname === '/attendance',
            show: true, // Visible to everyone (diff views or just employee)
        },
        {
            href: '/chat',
            label: 'Chat',
            icon: MessageSquare,
            active: pathname === '/chat',
            show: true,
        },
        {
            href: '/attendance-admin',
            label: 'Attendance Admin',
            icon: ShieldCheck,
            active: pathname === '/attendance-admin',
            show: userRole === 'ADMIN',
        },
        {
            href: '/user-approvals',
            label: 'User Approvals',
            icon: UserCheck,
            active: pathname === '/user-approvals',
            show: userRole === 'ADMIN',
        },
        {
            href: '/members',
            label: 'Members',
            icon: Users,
            active: pathname === '/members',
            show: userRole === 'ADMIN',
        },
    ]

    const visibleLinks = links.filter(link => link.show)

    return (
        <div className="flex flex-col h-full w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-4">
            <div className="flex items-center gap-2 px-2 py-4 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                    <SquareKanban className="text-white h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-white bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    MomentoFlow
                </span>
            </div>

            <nav className="space-y-2 flex-1">
                {visibleLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                            link.active
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                    >
                        <link.icon className={cn(
                            "h-5 w-5 transition-colors",
                            link.active ? "text-yellow-400" : "text-slate-500 group-hover:text-slate-300"
                        )} />
                        <span className="font-medium flex-1">{link.label}</span>
                        {link.href === '/chat' && unreadChatCount > 0 && (
                            <Badge className="bg-yellow-500 text-black border-none text-[10px] px-1.5 h-4 min-w-[16px] flex items-center justify-center animate-pulse">
                                {unreadChatCount}
                            </Badge>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="pt-4 border-t border-white/10">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-3"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    )
}
