import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { use } from 'react'

// GET a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    const task = await db.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        labels: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        checklists: {
          include: {
            items: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        attachments: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    const body = await request.json()
    const {
      title,
      description,
      priority,
      dueDate,
      type,
      status,
      assignedId,
      labels,
    } = body

    console.log('Updating task id:', id, 'with status:', status)

    const existingTask = await db.task.findUnique({
      where: { id },
      select: { assignedId: true, title: true, status: true, createdById: true },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...(assignedId !== undefined && { assignedId: assignedId || null }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        labels: true,
      },
    })

    // Update labels if provided
    if (labels !== undefined) {
      await db.label.deleteMany({
        where: { taskId: id },
      })

      if (labels.length > 0) {
        await db.task.update({
          where: { id },
          data: {
            labels: {
              create: labels.map((label: any) => ({
                name: typeof label === 'string' ? label : label.name,
                color: typeof label === 'object' && label.color ? label.color : 'gray',
              })),
            },
          },
        })
      }
    }

    // Create notifications for status changes (role-aware)
    if (status && status !== existingTask.status) {
      const { updaterId, updaterRole } = body
      const changerRole = updaterRole?.toUpperCase() || 'EMPLOYEE'

      const users = await db.user.findMany({
        where: {
          id: { not: updaterId || 'none' } // Never notify the person who did the action
        }
      })

      for (const user of users) {
        const isUserAdmin = user.role?.toUpperCase() === 'ADMIN'
        const isUserAssignee = user.id === (assignedId || existingTask.assignedId)
        const isUserCreator = user.id === existingTask.createdById

        // Logic:
        // 1. If an Employee moves a card, notify all Admins.
        // 2. If an Admin moves a card, notify the Assignee (if they are an Employee).

        if (changerRole === 'ADMIN') {
          // Admin action: Notify the assignee if they are an employee
          if (isUserAssignee && !isUserAdmin) {
            await db.notification.create({
              data: {
                type: 'card_moved',
                message: `Admin has moved your task "${title || existingTask.title}" from ${existingTask.status} to ${status}`,
                taskId: id,
                userId: user.id,
              },
            })
          }
        } else {
          // Employee action: Notify admins
          if (isUserAdmin) {
            const changer = await db.user.findUnique({ where: { id: updaterId }, select: { name: true } })
            const changerName = changer?.name || 'An employee'
            await db.notification.create({
              data: {
                type: 'card_moved',
                message: `${changerName} moved task "${title || existingTask.title}" from ${existingTask.status} to ${status}`,
                taskId: id,
                userId: user.id,
              },
            })
          }
        }
      }
    }

    if (assignedId && assignedId !== existingTask.assignedId && assignedId !== body.updaterId) {
      await db.notification.create({
        data: {
          type: 'card_assigned',
          message: `You have been assigned to task: ${title || existingTask.title}`,
          taskId: id,
          userId: assignedId,
        },
      })
    }

    const finalTask = await db.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        labels: true,
      },
    })

    return NextResponse.json(finalTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    await db.task.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
