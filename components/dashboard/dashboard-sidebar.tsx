"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload, User, LogOut, Home } from "lucide-react"

interface DashboardSidebarProps {
  currentPage: "dashboard" | "cleanlify" | "profile"
  onPageChange: (page: "dashboard" | "cleanlify" | "profile") => void
  onLogout: () => void
}

const navigation = [
  { name: "Dashboard", href: "dashboard", icon: Home },
  { name: "Cleanlify", href: "cleanlify", icon: Upload },
  { name: "Profile", href: "profile", icon: User },
]

export function DashboardSidebar({ currentPage, onPageChange, onLogout }: DashboardSidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 shadow-sm border-r border-gray-200 dark:border-gray-700">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-2xl font-bold text-blue-600">Cleanlify</h1>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        currentPage === item.href
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "text-gray-700 hover:text-blue-700 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-950",
                      )}
                      onClick={() => onPageChange(item.href as any)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </li>

            <li className="mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-300 dark:hover:bg-red-950"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
