'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, UserCog, Shield, ShieldAlert, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { DashboardHeader } from '@/components/DashboardHeader'

interface UserType {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'EMPLOYEE'
    createdAt: string
}

export default function MembersPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [users, setUsers] = useState<UserType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        // Check auth
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
            router.replace('/auth/login')
            return
        }
        const user = JSON.parse(storedUser)
        setCurrentUser(user)
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            if (res.ok) {
                setUsers(data.users)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch users',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId))
                toast({
                    title: 'Success',
                    description: 'User deleted successfully',
                })
            } else {
                const data = await res.json()
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete user',
                variant: 'destructive',
            })
        }
    }

    const handleToggleRole = async (user: UserType) => {
        const newRole = user.role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN'

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            })

            if (res.ok) {
                setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u))
                toast({
                    title: 'Success',
                    description: `Role updated to ${newRole}`,
                })
            } else {
                const data = await res.json()
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update role',
                variant: 'destructive',
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            <DashboardHeader title="Team Members" user={currentUser} />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="container mx-auto px-4 py-6 space-y-6">

                    <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-xl text-white">Users Directory</CardTitle>
                            <CardDescription className="text-slate-400">
                                Total members: {users.length}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-white/5">
                                        <TableHead className="text-slate-300">Name</TableHead>
                                        <TableHead className="text-slate-300">Role</TableHead>
                                        <TableHead className="text-slate-300">Email</TableHead>
                                        <TableHead className="text-slate-300">Joined</TableHead>
                                        <TableHead className="text-right text-slate-300">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-slate-200">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                            {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {user.name}
                                                    {currentUser?.id === user.id && (
                                                        <Badge variant="outline" className="ml-2 text-[10px] border-yellow-500/50 text-yellow-300">You</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={user.role === 'ADMIN'
                                                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/70'
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400">{user.email}</TableCell>
                                            <TableCell className="text-slate-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {currentUser?.role === 'ADMIN' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {user.id !== currentUser.id && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleToggleRole(user)}
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                                                                    title="Toggle Role"
                                                                >
                                                                    <UserCog className="h-4 w-4" />
                                                                </Button>

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                                                            <AlertDialogDescription className="text-slate-400">
                                                                                Are you sure you want to delete {user.name}? This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white">Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteUser(user.id)}
                                                                                className="bg-red-600 hover:bg-red-700 text-white border-none"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
