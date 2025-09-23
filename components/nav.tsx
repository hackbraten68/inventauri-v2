"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import {
  Boxes,
  LayoutDashboard,
  LogIn,
  Menu,
  Moon,
  Package2,
  Receipt,
  Sun,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"

import { cn } from "@/lib/utils"
import { useSupabase } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/sales/new", label: "New Sale", icon: Receipt },
]

export default function Nav() {
  const supabase = useSupabase()
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription?.unsubscribe()
  }, [supabase])

  useEffect(() => {
    setMounted(true)
  }, [])

  const initials = useMemo(
    () => user?.email?.[0]?.toUpperCase() ?? user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? "?",
    [user]
  )

  const toggleTheme = () => {
    if (!mounted) return
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/auth/signin")
    }
  }

  if (loading || pathname.startsWith("/auth")) {
    return null
  }

  const ThemeButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      disabled={!mounted}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-content-center rounded-lg bg-primary/10 text-primary">
            <Package2 className="h-5 w-5" />
          </span>
          Inventauri
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {ThemeButton}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email ?? "Account"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{user.user_metadata?.full_name || "Account"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NAV_LINKS.map(({ href, label }) => (
                  <DropdownMenuItem asChild key={href}>
                    <Link href={href}>{label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <button className="w-full text-left text-sm" onClick={handleSignOut}>
                    Sign out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link href="/auth/signin" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          )}

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col gap-6">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                    <span className="grid h-9 w-9 place-content-center rounded-lg bg-primary/10 text-primary">
                      <Package2 className="h-5 w-5" />
                    </span>
                    Inventauri
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-2">
                  <span className="text-xs text-muted-foreground">Theme</span>
                  {ThemeButton}
                </div>
                {user ? (
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign out
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/auth/signin">Sign in</Link>
                  </Button>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
