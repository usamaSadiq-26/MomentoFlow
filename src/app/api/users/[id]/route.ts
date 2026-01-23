import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        console.log('Deleting user:', id)

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Optional: Prevent deleting the last admin or specific logic
        // For now, just delete

        const deletedUser = await db.user.delete({
            where: { id },
        })

        return NextResponse.json({
            message: 'User deleted successfully',
            user: deletedUser,
        })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { role, isApproved } = body

        const updateData: any = {}

        if (role !== undefined) {
            updateData.role = role
        }

        if (isApproved !== undefined) {
            updateData.isApproved = isApproved
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            )
        }

        const updatedUser = await db.user.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json({
            user: updatedUser,
            message: 'User updated successfully',
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}
