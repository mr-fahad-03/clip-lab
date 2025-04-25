"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, Search, Bell, User, Video, Mic, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInitial, setUserInitial] = useState("U")
  const router = useRouter()

  useEffect(() => {
    // Check if user data exists in localStorage
    const userData = localStorage.getItem("userData")
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        setIsLoggedIn(true)
        if (parsedData.name) {
          setUserInitial(parsedData.name.charAt(0).toUpperCase())
        }
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSignIn = () => {
    // For demo purposes, we'll just simulate a login
    const mockUserData = {
      name: "User",
      email: "user@example.com",
      id: "user123",
    }
    localStorage.setItem("userData", JSON.stringify(mockUserData))
    setIsLoggedIn(true)
    setUserInitial(mockUserData.name.charAt(0).toUpperCase())
  }

  const handleSignOut = () => {
    localStorage.removeItem("userData")
    setIsLoggedIn(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <Video className="h-6 w-6 text-red-600" />
            <span className="text-xl font-semibold hidden sm:inline-block">MyTube</span>
          </Link>
        </div>
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 flex items-center">
          <div className="relative flex-1 flex items-center">
            <Input
              type="search"
              placeholder="Search"
              className="pr-10 rounded-r-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="icon" className="absolute right-0 rounded-l-none h-full">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          <Button type="button" variant="ghost" size="icon" className="ml-2 hidden sm:flex">
            <Mic className="h-5 w-5" />
            <span className="sr-only">Voice search</span>
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <Link href="/downloads">
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
              <span className="sr-only">Downloads</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white cursor-pointer hidden md:flex"
                onClick={handleSignOut}
              >
                {userInitial}
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleSignIn} className="hidden md:flex">
              <User className="h-4 w-4 mr-2" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
