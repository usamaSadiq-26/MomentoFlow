'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Play,
    Square,
    Clock,
    Calendar as CalendarIcon,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'

interface AttendanceRecord {
    id: string
    date: string
    shiftStart: string | null
    shiftEnd: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    punctuality: 'ON_TIME' | 'LATE' | 'HALF_DAY'
    notes: string | null
}

export default function AttendancePage() {
    const [user, setUser] = useState<any>(null)
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [currentShift, setCurrentShift] = useState<AttendanceRecord | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
            fetchAttendance(parsedUser.id, currentMonth, currentYear)
        }
    }, [currentMonth, currentYear])

    const fetchAttendance = async (userId: string, month: number, year: number) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/attendance?userId=${userId}&month=${month}&year=${year}`)
            const data = await res.json()

            if (!Array.isArray(data)) {
                console.error('Attendance data is not an array:', data)
                setRecords([])
                return
            }

            setRecords(data)

            // Check if there's an ongoing shift for today
            const today = new Date().toISOString().split('T')[0]
            const todayShift = data.find((r: any) => r.date.startsWith(today))
            setCurrentShift(todayShift || null)
        } catch (error) {
            console.error('Error fetching attendance:', error)
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    const handleShiftAction = async (action: 'start' | 'end') => {
        if (!user) return

        try {
            setActionLoading(true)
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    action,
                }),
            })

            if (res.ok) {
                fetchAttendance(user.id, currentMonth, currentYear)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to update shift')
            }
        } catch (error) {
            console.error('Error in shift action:', error)
        } finally {
            setActionLoading(false)
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
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
    }

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="Attendance Tracking" user={user} />

            {/* Stats and Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-400" />
                            Shift Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-black/20 rounded-xl border border-white/5">
                            <div className="space-y-1">
                                <p className="text-slate-400 text-sm">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-3 w-3 rounded-full animate-pulse ${currentShift?.shiftStart && !currentShift?.shiftEnd ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                    <p className="text-xl font-bold text-white">
                                        {currentShift?.shiftStart && !currentShift?.shiftEnd ? 'Shift in Progress' : 'No Active Shift'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={() => handleShiftAction('start')}
                                    disabled={!!currentShift?.shiftStart || actionLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-6 rounded-xl"
                                >
                                    <Play className="h-5 w-5" />
                                    Start Shift
                                </Button>
                                <Button
                                    onClick={() => handleShiftAction('end')}
                                    disabled={!currentShift?.shiftStart || !!currentShift?.shiftEnd || actionLoading}
                                    className="bg-rose-600 hover:bg-rose-700 text-white gap-2 h-12 px-6 rounded-xl"
                                >
                                    <Square className="h-5 w-5" />
                                    End Shift
                                </Button>
                            </div>
                        </div>

                        {currentShift && (
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Sign In</p>
                                    <p className="text-xl font-semibold text-white">{formatTime(currentShift.shiftStart)}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Sign Out</p>
                                    <p className="text-xl font-semibold text-white">{formatTime(currentShift.shiftEnd)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                            Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <CalendarIcon className="h-4 w-4 text-yellow-400" />
                            </div>
                            <p className="text-sm text-slate-300">
                                Shift requests are submitted to the admin for approval at the end of each day.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-white">Firm Shift Hours</p>
                                <p className="text-xs text-slate-400">18:00 (6:00 PM) - 03:00 (3:00 AM)</p>
                                <div className="space-y-0.5 mt-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rules:</p>
                                    <p className="text-[11px] text-slate-400">• Start \u003e 18:00 = Late</p>
                                    <p className="text-[11px] text-slate-400">• Start \u003e 20:00 = Half Day</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-yellow-400" />
                            </div>
                            <p className="text-sm text-slate-300">
                                Once approved, your attendance record will contribute to your monthly report.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Records */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Monthly Attendance</CardTitle>
                    <div className="flex items-center gap-4 bg-black/20 p-1 rounded-lg border border-white/10">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-slate-400 hover:text-white">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-white min-w-[120px] text-center">
                            {months[currentMonth]} {currentYear}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-slate-400 hover:text-white">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Date</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Start Time</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">End Time</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Punctuality</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">Loading records...</td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">No attendance records for this period.</td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 text-sm text-white font-medium">{formatDate(record.date)}</td>
                                            <td className="py-4 px-4 text-sm text-slate-300">{formatTime(record.shiftStart)}</td>
                                            <td className="py-4 px-4 text-sm text-slate-300">{formatTime(record.shiftEnd)}</td>
                                            <td className="py-4 px-4 text-sm">{getPunctualityBadge(record.punctuality)}</td>
                                            <td className="py-4 px-4 text-sm">{getStatusBadge(record.status)}</td>
                                            <td className="py-4 px-4 text-sm text-slate-400 italic">{record.notes || '-'}</td>
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
