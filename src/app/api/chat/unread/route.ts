import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const since = searchParams.get('since')

        if (!since) {
            return NextResponse.json({ count: 0 })
        }

        const count = await db.chatMessage.count({
            where: {
                createdAt: {
                    gt: new Date(since),
                },
            },
        })

        return NextResponse.json({ count })
    } catch (error) {
        console.error('Error fetching unread count:', error)
        return NextResponse.json({ count: 0 })
    }
}
