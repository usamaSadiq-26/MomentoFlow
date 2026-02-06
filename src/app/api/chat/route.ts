import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const cursor = searchParams.get('cursor')

        const messages = await db.chatMessage.findMany({
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        })

        // Return in chronological order for the client
        return NextResponse.json(messages.reverse())
    } catch (error) {
        console.error('Error fetching chat messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { content, userId } = body

        if (!content || !userId) {
            return NextResponse.json(
                { error: 'Content and userId are required' },
                { status: 400 }
            )
        }

        const message = await db.chatMessage.create({
            data: {
                content,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        )
    }
}
