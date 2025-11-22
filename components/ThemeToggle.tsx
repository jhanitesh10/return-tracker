"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "p-2 rounded-md transition-all",
          theme === "light"
            ? "bg-white text-black shadow-sm"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        )}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "p-2 rounded-md transition-all",
          theme === "dark"
            ? "bg-gray-800 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        )}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "p-2 rounded-md transition-all",
          theme === "system"
            ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        )}
        title="System Theme"
      >
        <Monitor size={16} />
      </button>
    </div>
  )
}
