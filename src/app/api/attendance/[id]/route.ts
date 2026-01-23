import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH approve or reject attendance
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json()
        const { status, punctuality, approvedBy, notes } = body
        const { id } = await params

        if (!status || !approvedBy) {
            return NextResponse.json(
                { error: 'status and approvedBy are required' },
                { status: 400 }
            )
        }

        if (status !== 'APPROVED' && status !== 'REJECTED') {
            return NextResponse.json(
                { error: 'status must be APPROVED or REJECTED' },
                { status: 400 }
            )
        }

        const attendance = await db.attendance.update({
            where: { id },
            data: {
                status,
                punctuality,
                approvedBy,
                approvedAt: new Date(),
                notes: notes || null,
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

        // Create notification for the employee
        const punctualityLabel = attendance.punctuality.replace('_', ' ').toLowerCase()
        await db.notification.create({
            data: {
                type: 'attendance_update',
                message: `Your attendance for ${new Date(attendance.date).toLocaleDateString()} has been ${status.toLowerCase()} (Status: ${punctualityLabel}).`,
                userId: attendance.userId,
            }
        })

        // Create notification for all other admins
        const otherAdmins = await db.user.findMany({
            where: {
                role: 'ADMIN',
                id: { not: approvedBy }
            },
            select: { id: true }
        })

        await Promise.all(otherAdmins.map(admin =>
            db.notification.create({
                data: {
                    type: 'attendance_update',
                    message: `Admin ${attendance.approvedBy} ${status.toLowerCase()} ${attendance.user.name}'s attendance for ${new Date(attendance.date).toLocaleDateString()}.`,
                    userId: admin.id,
                }
            })
        ))

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Error updating attendance:', error)
        return NextResponse.json(
            { error: 'Failed to update attendance' },
            { status: 500 }
        )
    }
}
