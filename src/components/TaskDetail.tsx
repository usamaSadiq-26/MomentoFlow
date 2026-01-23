'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar as CalendarIcon,
  User,
  Tag,
  CheckSquare2,
  MessageSquare,
  Paperclip,
  X,
  Send,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const LABEL_COLORS = {
  Urgent: 'bg-red-500',
  Feature: 'bg-purple-500',
  Bug: 'bg-orange-500',
  Research: 'bg-blue-500',
  Design: 'bg-pink-500',
}

const PRIORITIES = {
  High: 'bg-red-500 text-white',
  Medium: 'bg-amber-500 text-white',
  Low: 'bg-green-500 text-white',
}

interface TaskDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
}

export function TaskDetail({ open, onOpenChange, task }: TaskDetailProps) {
  console.log('TaskDetail received task:', task)
  const [newComment, setNewComment] = useState('')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [localComments, setLocalComments] = useState(task?.comments || [])
  const [localChecklists, setLocalChecklists] = useState(task?.checklists || [])

  // Update local state when task changes
  useEffect(() => {
    if (task) {
      setLocalComments(task.comments || [])
      setLocalChecklists(task.checklists || [])
    }
  }, [task])

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date()

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const comment = {
      id: Date.now().toString(),
      content: newComment,
      user: {
        name: currentUser.name || 'User',
        avatar: currentUser.name?.split(' ').map(n => n[0]).join('') || 'U',
      },
      createdAt: new Date(),
    }

    setLocalComments([comment, ...localComments])
    setNewComment('')
  }

  const handleToggleChecklistItem = (checklistId: string, itemId: string) => {
    setLocalChecklists(localChecklists.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: cl.items.map(item =>
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
          ),
        }
      }
      return cl
    }))
  }

  const handleAddChecklistItem = (checklistId: string) => {
    if (!newChecklistItem.trim()) return

    setLocalChecklists(localChecklists.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: [
            ...cl.items,
            {
              id: Date.now().toString(),
              title: newChecklistItem,
              isCompleted: false,
              position: cl.items.length,
            },
          ],
        }
      }
      return cl
    }))
    setNewChecklistItem('')
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-xl border border-white/10 text-slate-200">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl text-white">{task?.title}</DialogTitle>
              <DialogDescription className="mt-1 text-slate-400">
                {task?.type} • {task?.priority} Priority
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            {/* Labels and Priority */}
            <div className="flex items-center gap-3 flex-wrap">
              {task?.labels?.length > 0 && task.labels.map((label: any) => (
                <Badge
                  key={label.id}
                  className={`text-white ${LABEL_COLORS[label.name as keyof typeof LABEL_COLORS] || 'bg-slate-500'}`}
                >
                  {label.name}
                </Badge>
              ))}
              <Badge
                className={PRIORITIES[task?.priority as keyof typeof PRIORITIES]}
              >
                {task?.priority}
              </Badge>
              {task?.dueDate && (
                <Badge variant="outline" className={cn('bg-white/5 border-white/20 text-slate-200', isOverdue && 'border-red-500/50 text-red-400 bg-red-500/10')}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {isOverdue && ' (Overdue)'}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Description</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {task?.description || 'No description provided.'}
              </p>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-200">Assigned to:</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-violet-500/30 text-violet-300 border border-violet-500/50">
                    {task?.assignedTo?.avatar || task?.assignedTo?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-300">{task?.assignedTo?.name || 'Unassigned'}</span>
              </div>
            </div>

            {/* Checklists */}
            {localChecklists.length > 0 && localChecklists.map((checklist: any) => {
              const completedCount = checklist.items?.filter((item: any) => item.isCompleted).length || 0
              const totalCount = checklist.items?.length || 0

              return (
                <div key={checklist.id} className="border border-white/10 bg-slate-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <CheckSquare2 className="h-4 w-4 text-violet-400" />
                      {checklist.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300 border-none">
                      {completedCount}/{totalCount}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    {checklist.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleChecklistItem(checklist.id, item.id)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-violet-500 focus:ring-violet-500"
                        />
                        <span
                          className={cn(
                            'flex-1 text-sm text-slate-300',
                            item.isCompleted && 'line-through text-slate-500'
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                      className="flex-1 h-8 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleAddChecklistItem(checklist.id)}
                      className="h-8 w-8 border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Comments */}
            <div className="border border-white/10 bg-slate-800/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-400" />
                Comments ({localComments.length})
              </h3>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {localComments.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No comments yet</p>
                ) : (
                  localComments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-violet-500/30 text-violet-300 border border-violet-500/50">
                          {comment.user?.avatar || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-200">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment())}
                  className="flex-1 min-h-[60px] text-sm bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                />
                <Button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="h-auto self-end bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Attachments */}
            {task?.attachments?.length > 0 && (
              <div className="border border-white/10 bg-slate-800/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-violet-400" />
                  Attachments ({task.attachments.length})
                </h3>
                <div className="space-y-2">
                  {task.attachments.map((attachment: any) => (
                    <a
                      key={attachment.id}
                      href={attachment.url || '#'}
                      download={attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-white/10 hover:bg-slate-800/50 hover:border-violet-500/50 transition-all cursor-pointer group"
                    >
                      <Paperclip className="h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate group-hover:text-violet-300 transition-colors">{attachment.name}</p>
                        <p className="text-xs text-slate-400">
                          {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
