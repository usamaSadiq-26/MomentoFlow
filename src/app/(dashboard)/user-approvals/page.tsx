'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    UserCheck,
    UserX,
    UserPlus,
    Mail,
    Calendar as CalendarIcon,
    Shield,
    Trash2
} from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PendingUser {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
}

export default function UserApprovalsPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
        fetchPendingUsers()
    }, [])

    const fetchPendingUsers = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/users/pending')
            const data = await res.json()
            setPendingUsers(data)
        } catch (error) {
            console.error('Error fetching pending users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (userId: string) => {
        try {
            setActionLoading(userId)
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isApproved: true
                }),
            })

            if (res.ok) {
                setPendingUsers(pendingUsers.filter(u => u.id !== userId))
            } else {
                alert('Failed to approve user')
            }
        } catch (error) {
            console.error('Error approving user:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (userId: string) => {
        if (!confirm('Are you sure you want to reject and delete this user registration?')) return

        try {
            setActionLoading(userId)
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                setPendingUsers(pendingUsers.filter(u => u.id !== userId))
            } else {
                alert('Failed to reject user')
            }
        } catch (error) {
            console.error('Error rejecting user:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="User Registration Approvals" user={user} />

            {/* Info Card */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-violet-400" />
                        System Security
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400">
                        Account approvals are required for all new registrations. Once approved, users will be able to log in and access their dashboard.
                        Rejected registrations will be permanently deleted from the system.
                    </p>
                </CardContent>
            </Card>

            {/* Pending Users List */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-violet-400" />
                            Pending Registrations
                        </div>
                        <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                            {pendingUsers.length} Requested
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10">
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">User Info</th>
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Requested Role</th>
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Registration Date</th>
                                    <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-500">Loading pending requests...</td>
                                    </tr>
                                ) : pendingUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-500">No pending user approvals found.</td>
                                    </tr>
                                ) : (
                                    pendingUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                                                        <AvatarFallback className="bg-violet-500/20 text-violet-400 text-lg">
                                                            {user.name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{user.name || 'Anonymous'}</p>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={`${user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-slate-500/20 text-slate-400 border-slate-500/20'}`}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    {formatDate(user.createdAt)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-lg gap-2"
                                                        onClick={() => handleApprove(user.id)}
                                                        disabled={actionLoading === user.id}
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-9 px-4 rounded-lg gap-2 border border-white/5"
                                                        onClick={() => handleReject(user.id)}
                                                        disabled={actionLoading === user.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
