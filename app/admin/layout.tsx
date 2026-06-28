import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Settings, Package, HardDrive } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Subscription Plans', href: '/admin/plans', icon: Package },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">
      {/* Admin Sidebar */}
      <aside className="w-[280px] bg-surface border-r border-outline-variant/50 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-outline-variant/30">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-primary" />
            SkyBox Admin
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-4 px-4 py-2.5 rounded-xl text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-outline-variant/30">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
            &larr; Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-outline-variant/30 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-lg font-semibold text-on-surface">Super Admin Panel</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-on-surface-variant">{session.user.email}</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
              {session.user.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
