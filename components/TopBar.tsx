"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { SITE_NAME } from "@/lib/constants";
import { Button } from "./ui/Button";
import { ModelSelector } from "./ModelSelector";
import { Menu, Image, Code, LayoutGrid, MessageSquare, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useSession, signIn, signOut } from 'next-auth/react'

type Mode = "text" | "image" | "code" | "web";

interface TopBarProps {
  activeMode?: Mode;
  onModeChange?: (mode: Mode) => void;
  className?: string;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export function TopBar({
  activeMode = "text",
  onModeChange,
  className,
  sidebarOpen = true,
  setSidebarOpen,
  selectedModel,
  onModelChange,
}: TopBarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user

  const toggleSidebar = () => setSidebarOpen && setSidebarOpen(!sidebarOpen);

  const modeIcons = {
    text: MessageSquare,
    image: Image,
    code: Code,
    web: LayoutGrid,
  } as const;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "w-full h-20 grid grid-cols-3 items-center px-4 sm:px-6 bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-50",
        className
      )}
    >
      {/* Left: menu + brand */}
      <div className="flex items-center gap-3 sm:gap-4">
        {setSidebarOpen && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 border border-gray-200"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                {sidebarOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </motion.div>
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-3">
          <Logo size={80} />
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{SITE_NAME}</span>
            <span className="text-xs sm:text-sm font-medium text-indigo-600">Studio</span>
          </div>
        </motion.div>
      </div>

      {/* Center: mode control (lg+) */}
      <div className="hidden lg:flex items-center justify-center">
        {onModeChange && (
          <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            {(["text", "image", "code", "web"] as Mode[]).map((mode) => {
              const Icon = modeIcons[mode];
              const isActive = activeMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "relative h-9 px-3 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  title={`Switch to ${mode} mode`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="capitalize hidden xl:inline">{mode}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: model selector + user */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {selectedModel && onModelChange && (
          <div className="hidden md:flex items-center">
            <ModelSelector activeMode={activeMode} selectedModel={selectedModel} onModelChange={onModelChange} />
          </div>
        )}
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="relative">
          <button
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-2 py-1 pr-2"
            onClick={() => setIsUserMenuOpen((v) => !v)}
            title="User menu"
          >
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarImage src={user?.image || "/user-avatar.svg"} alt={user?.name || "User"} />
              <AvatarFallback className="bg-gray-800 text-white text-xs">{(user?.name || 'You').slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col leading-tight text-left">
              <span className="text-sm font-semibold text-gray-900">{user?.name || 'Guest'}</span>
              <span className="text-xs text-gray-500">{user?.email || 'Not signed in'}</span>
            </div>
          </button>
          {isUserMenuOpen && (
      <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl p-3 z-[60]">
              <div className="flex items-center gap-3 p-2">
                <Avatar className="h-10 w-10 border border-gray-200">
                  <AvatarImage src={user?.image || "/user-avatar.svg"} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-gray-800 text-white text-xs">{(user?.name || 'You').slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{user?.name || 'Guest'}</span>
                  <span className="text-xs text-gray-500">{user?.email || 'Not signed in'}</span>
                </div>
              </div>
              <div className="mt-2 grid gap-2">
                <a href="/profile" className="w-full">
                  <Button variant="ghost" className="justify-start w-full hover:bg-gray-100 text-gray-700">View profile</Button>
                </a>
                {!user && (
                  <a href="/login" className="w-full">
                    <Button variant="ghost" className="justify-start w-full hover:bg-gray-100 text-gray-700">Sign in</Button>
                  </a>
                )}
                <div className="h-px bg-gray-200 my-1" />
                {user ? (
                  <Button onClick={() => signOut({ callbackUrl: '/' })} variant="ghost" className="justify-start w-full text-red-600 hover:bg-red-50">Sign out</Button>
                ) : (
                  <Button onClick={() => signIn('google')} variant="ghost" className="justify-start w-full text-gray-700 hover:bg-gray-100">Sign in with Google</Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
