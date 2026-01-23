import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET attendance records
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const month = searchParams.get('month')
        const year = searchParams.get('year')
        const status = searchParams.get('status')

        const currentDate = new Date()
        const targetMonth = month ? parseInt(month) : currentDate.getMonth()
        const targetYear = year ? parseInt(year) : currentDate.getFullYear()

        // Start and end of the month
        const startDate = new Date(targetYear, targetMonth, 1)
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

        const where: any = {
            date: {
                gte: startDate,
                lte: endDate,
            },
        }

        if (userId) {
            where.userId = userId
        }

        if (status) {
            where.status = status
        }

        const attendanceRecords = await db.attendance.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        })

        return NextResponse.json(attendanceRecords)
    } catch (error) {
        console.error('Error fetching attendance:', error)
        return NextResponse.json(
            { error: 'Failed to fetch attendance records' },
            { status: 500 }
        )
    }
}

// POST create attendance record (start/end shift)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, action } = body // action: 'start' or 'end'

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'userId and action are required' },
                { status: 400 }
            )
        }

        // Get today's date (start of day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // For night shift (18:00 - 03:00), we search for the most recent incomplete record
        let attendance = await db.attendance.findFirst({
            where: {
                userId,
                shiftEnd: null,
            },
            orderBy: {
                date: 'desc',
            }
        })

        if (action === 'start') {
            if (attendance) {
                return NextResponse.json(
                    { error: 'Shift already started for today' },
                    { status: 400 }
                )
            }

            // Calculate punctuality
            const now = new Date()
            const hours = now.getHours()
            const minutes = now.getMinutes()
            const currentTimeInMinutes = hours * 60 + minutes

            let punctuality = 'ON_TIME'
            if (currentTimeInMinutes > 20 * 60) {
                punctuality = 'HALF_DAY'
            } else if (currentTimeInMinutes > 18 * 60) {
                punctuality = 'LATE'
            }

            // Create new attendance record
            attendance = await db.attendance.create({
                data: {
                    userId,
                    date: today, // This remains the start date of the shift
                    shiftStart: now,
                    status: 'PENDING',
                    punctuality,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            })

            // Create notification for all admins
            const admins = await db.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            })

            const startTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            await Promise.all(admins.map(admin =>
                db.notification.create({
                    data: {
                        type: 'attendance_update',
                        message: `${attendance.user.name} has started their shift (${startTimeStr}).`,
                        userId: admin.id,
                    }
                })
            ))

            return NextResponse.json(attendance, { status: 201 })
        } else if (action === 'end') {
            if (!attendance) {
                return NextResponse.json(
                    { error: 'No shift started for today' },
                    { status: 400 }
                )
            }

            if (attendance.shiftEnd) {
                return NextResponse.json(
                    { error: 'Shift already ended' },
                    { status: 400 }
                )
            }

            const endTime = new Date()
            // Update attendance record with end time
            attendance = await db.attendance.update({
                where: {
                    id: attendance.id,
                },
                data: {
                    shiftEnd: endTime,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            })

            // Create notification for all admins
            const admins = await db.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            })

            const endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            await Promise.all(admins.map(admin =>
                db.notification.create({
                    data: {
                        type: 'attendance_update',
                        message: `${attendance.user.name} has ended their shift (${endTimeStr}).`,
                        userId: admin.id,
                    }
                })
            ))

            return NextResponse.json(attendance)
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "start" or "end"' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error creating attendance:', error)
        return NextResponse.json(
            { error: 'Failed to create attendance record' },
            { status: 500 }
        )
    }
}
