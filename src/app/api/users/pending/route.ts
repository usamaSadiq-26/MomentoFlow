import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET pending user registrations (admin only)
export async function GET(request: NextRequest) {
    try {
        const pendingUsers = await db.user.findMany({
            where: {
                isApproved: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(pendingUsers)
    } catch (error) {
        console.error('Error fetching pending users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch pending users' },
            { status: 500 }
        )
    }
}
