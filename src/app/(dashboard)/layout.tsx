import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-screen flex bg-[url('/background-abstract.jpg')] bg-cover bg-center bg-fixed no-repeat">
            <Sidebar />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </main>
        </div>
    )
}
