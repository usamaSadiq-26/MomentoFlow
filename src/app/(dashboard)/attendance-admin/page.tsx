'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Check,
    X,
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Clock
} from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface AttendanceRecord {
    id: string
    date: string
    shiftStart: string | null
    shiftEnd: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    punctuality: 'ON_TIME' | 'LATE' | 'HALF_DAY'
    notes: string | null
    user: {
        id: string
        name: string
        email: string
        avatar: string | null
    }
}

export default function AttendanceAdminPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    // Approval Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
    const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
    const [selectedPunctuality, setSelectedPunctuality] = useState<'ON_TIME' | 'LATE' | 'HALF_DAY'>('ON_TIME')
    const [adminNotes, setAdminNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser))
        }
        fetchAttendance(currentMonth, currentYear)
    }, [currentMonth, currentYear])

    const fetchAttendance = async (month: number, year: number) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/attendance?month=${month}&year=${year}`)
            const data = await res.json()

            if (!Array.isArray(data)) {
                console.error('Attendance data is not an array:', data)
                setRecords([])
                return
            }

            setRecords(data)
        } catch (error) {
            console.error('Error fetching attendance:', error)
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (record: AttendanceRecord, action: 'APPROVED' | 'REJECTED') => {
        setSelectedRecord(record)
        setApprovalAction(action)
        setSelectedPunctuality(record.punctuality)
        setAdminNotes('')
        setIsModalOpen(true)
    }

    const submitAction = async () => {
        if (!selectedRecord || !currentUser) return

        try {
            setSubmitting(true)
            const res = await fetch(`/api/attendance/${selectedRecord.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: approvalAction,
                    punctuality: selectedPunctuality,
                    approvedBy: currentUser.id,
                    notes: adminNotes,
                }),
            })

            if (res.ok) {
                setIsModalOpen(false)
                fetchAttendance(currentMonth, currentYear)
            } else {
                alert('Failed to update record')
            }
        } catch (error) {
            console.error('Error in approval action:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">Approved</Badge>
            case 'REJECTED':
                return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20">Rejected</Badge>
            default:
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">Pending</Badge>
        }
    }

    const getPunctualityBadge = (punctuality: string) => {
        switch (punctuality) {
            case 'LATE':
                return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20">Late</Badge>
            case 'HALF_DAY':
                return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20">Half Day</Badge>
            default:
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">On Time</Badge>
        }
    }

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '--:--'
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const filteredRecords = records.filter(record =>
        record.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="Employee Attendance Management" user={currentUser} />

            {/* Stats and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 md:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-yellow-400" />
                                Requests Filter
                            </div>
                            <div className="flex items-center gap-4 bg-black/20 p-1 rounded-lg border border-white/10">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)} className="h-8 w-8 text-slate-400 hover:text-white">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium text-white min-w-[120px] text-center">
                                    {months[currentMonth]} {currentYear}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)} className="h-8 w-8 text-slate-400 hover:text-white">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search by employee name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:ring-yellow-500/50"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">Pending Approval</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-amber-400">
                            {records.filter(r => r.status === 'PENDING').length}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Requests for this month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Table */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10">
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Employee</th>
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Date</th>
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Sign In / Out</th>
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Punctuality</th>
                                    <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Status</th>
                                    <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">Loading records...</td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">No attendance records found.</td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-white/10">
                                                        <AvatarFallback className="bg-yellow-500/10 text-yellow-400">
                                                            {record.user.name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{record.user.name}</p>
                                                        <p className="text-xs text-slate-500">{record.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-300">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-500">In</p>
                                                        <p className="text-sm text-white font-medium">{formatTime(record.shiftStart)}</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-white/5" />
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Out</p>
                                                        <p className="text-sm text-white font-medium">{formatTime(record.shiftEnd)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {getPunctualityBadge(record.punctuality)}
                                            </td>
                                            <td className="py-4 px-6 text-sm">
                                                {getStatusBadge(record.status)}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {record.status === 'PENDING' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20 h-8 gap-1.5"
                                                            onClick={() => handleAction(record, 'APPROVED')}
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20 h-8 gap-1.5"
                                                            onClick={() => handleAction(record, 'REJECTED')}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500 italic text-xs flex items-center justify-end gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Processed
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Approval Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {approvalAction === 'APPROVED' ? (
                                <Check className="h-5 w-5 text-emerald-400" />
                            ) : (
                                <X className="h-5 w-5 text-rose-400" />
                            )}
                            {approvalAction === 'APPROVED' ? 'Approve' : 'Reject'} Attendance Request
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-400">Employee</p>
                                {getPunctualityBadge(selectedRecord?.punctuality || 'ON_TIME')}
                            </div>
                            <p className="text-sm font-medium">{selectedRecord?.user.name}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <div>
                                    <p className="text-[10px] text-slate-500">SIGN IN</p>
                                    <p className="text-sm">{formatTime(selectedRecord?.shiftStart || null)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500">SIGN OUT</p>
                                    <p className="text-sm">{formatTime(selectedRecord?.shiftEnd || null)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-400" />
                                Override Punctuality Status
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Review and adjust the punctuality status if needed before approving.</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-9 border-white/10 ${selectedPunctuality === 'ON_TIME' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-black/20 text-slate-400'}`}
                                    onClick={() => setSelectedPunctuality('ON_TIME')}
                                >
                                    On Time
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-9 border-white/10 ${selectedPunctuality === 'LATE' ? 'bg-orange-600/20 text-orange-400 border-orange-500/50' : 'bg-black/20 text-slate-400'}`}
                                    onClick={() => setSelectedPunctuality('LATE')}
                                >
                                    Late
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-9 border-white/10 ${selectedPunctuality === 'HALF_DAY' ? 'bg-rose-600/20 text-rose-400 border-rose-500/50' : 'bg-black/20 text-slate-400'}`}
                                    onClick={() => setSelectedPunctuality('HALF_DAY')}
                                >
                                    Half Day
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Admin Notes (Optional)
                            </label>
                            <Textarea
                                placeholder="Add a reason or comment..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="bg-black/20 border-white/10 focus:ring-yellow-500/50 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 border border-white/10">
                            Cancel
                        </Button>
                        <Button
                            onClick={submitAction}
                            disabled={submitting}
                            className={approvalAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                        >
                            Confirm {approvalAction === 'APPROVED' ? 'Approval' : 'Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
