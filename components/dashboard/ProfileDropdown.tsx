"use client";

import { useState, useEffect } from "react";
import {
  Check,
  ChevronUp,
  Settings,
  Crown,
  DoorOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface ProfileDropdownProps {
  user: User;
  profile: any;
}

export default function ProfileDropdown({ user, profile }: ProfileDropdownProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    { 
      icon: <Settings className="w-5 h-5" />, 
      label: "Configuración",
      onClick: () => router.push("/dashboard/configuracion")
    },
    {
      icon: <Crown className="w-5 h-5" />,
      label: "Upgrade to Pro",
      action: true,
      actionLabel: "Upgrade",
      onClick: () => console.log("Upgrade clicked")
    },
    {
      icon: <DoorOpen className="w-5 h-5" />,
      label: "Cerrar Sesión",
      danger: true,
      onClick: handleSignOut
    },
  ];

  return (
    <div className="relative mr-4">
      {/* Trigger Button - Horizontal Layout like Spectrum */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 shadow-sm"
      >
        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {getInitials(profile?.business_name || user.email || "U")}
        </div>
        
        {/* User Info */}
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {profile?.business_name || "Mi Negocio"}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {user.email}
          </span>
        </div>

        {/* Verified Badge */}
        <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
          <Check className="w-3 h-3 text-white" />
        </div>

        {/* Dropdown Arrow */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronUp className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 top-full mt-2 z-50 w-96 max-h-[80vh] overflow-y-auto rounded-3xl bg-white shadow-lg dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Profile Header */}
              <motion.div
                className="p-6 border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200"
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center">
                  <motion.div
                    className="relative w-12 h-12 mr-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="absolute inset-1 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center rounded-full text-lg font-medium">
                        {getInitials(profile?.business_name || user.email || "U")}
                      </div>
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {profile?.business_name || "Mi Negocio"}
                      </h2>
                      <motion.div
                        className="ml-2 flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                      {user.email}
                    </p>
                  </div>
                  <motion.button
                    className="text-neutral-500 dark:text-neutral-400"
                    onClick={() => setIsOpen(!isOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{ rotate: isOpen ? 0 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Card Section */}
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <motion.div
                  className="rounded-xl p-5 overflow-hidden relative transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    background:
                      theme === "light"
                        ? "linear-gradient(to right, #f0f9ff, #e0f2fe, #bae6fd, #7dd3fc)"
                        : "linear-gradient(to bottom, #525252, #262626, #171717, #000000)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <div className="flex justify-between mb-16">
                    <div
                      className={
                        theme === "light" ? "text-neutral-800" : "text-white"
                      }
                    >
                      <svg
                        fill="currentColor"
                        width="30px"
                        height="30px"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
                      </svg>
                    </div>
                    <div
                      className={
                        theme === "light" ? "text-neutral-800" : "text-white"
                      }
                    >
                      <svg
                        fill="currentColor"
                        width="50px"
                        height="50px"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M16.539 9.186a4.155 4.155 0 0 0-1.451-.251c-1.6 0-2.73.806-2.738 1.963-.01.85.803 1.329 1.418 1.613.631.292.842.476.84.737-.004.397-.504.577-.969.577-.639 0-.988-.089-1.525-.312l-.199-.093-.227 1.332c.389.162 1.09.301 1.814.313 1.701 0 2.813-.801 2.826-2.032.014-.679-.426-1.192-1.352-1.616-.563-.275-.912-.459-.912-.738 0-.247.299-.511.924-.511a2.95 2.95 0 0 1 1.213.229l.15.067.227-1.287-.039.009zm4.152-.143h-1.25c-.389 0-.682.107-.852.493l-2.404 5.446h1.701l.34-.893 2.076.002c.049.209.199.891.199.891h1.5l-1.31-5.939zm-10.642-.05h1.621l-1.014 5.942H9.037l1.012-5.944v.002zm-4.115 3.275.168.825 1.584-4.05h1.717l-2.551 5.931H5.139l-1.4-5.022a.339.339 0 0 0-.149-.199 6.948 6.948 0 0 0-1.592-.589l.022-.125h2.609c.354.014.639.125.734.503l.57 2.729v-.003zm12.757.606.646-1.662c-.008.018.133-.343.215-.566l.111.513.375 1.714H18.69v.001h.001z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div
                      className={`font-mono ${theme === "light" ? "text-neutral-800" : "text-white"}`}
                    >
                      {profile?.business_name || "Usuario"}
                    </div>
                    <div
                      className={`ml-auto font-mono ${theme === "light" ? "text-neutral-800" : "text-white"}`}
                    >
                      {new Date().toLocaleDateString('es', { month: '2-digit', year: '2-digit' })}
                    </div>
                  </div>

                  <div
                    className={`font-mono text-xl tracking-widest ${theme === "light" ? "text-neutral-800" : "text-white"}`}
                  >
                    •••• •••• •••• {user.id?.slice(-4) || "0000"}
                  </div>
                </motion.div>
              </div>

              {/* Theme Toggle */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
                  <motion.button
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
                      theme === "light"
                        ? "bg-white dark:bg-neutral-600 shadow-sm"
                        : ""
                    }`}
                    onClick={() => setTheme("light")}
                    whileHover={{ scale: theme !== "light" ? 1.03 : 1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Sun
                      className={`w-4 h-4 mr-2 ${
                        theme === "light"
                          ? "text-amber-500"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}
                    />
                    <span
                      className={
                        theme === "light"
                          ? "text-neutral-900 dark:text-white font-medium"
                          : "text-neutral-500 dark:text-neutral-400"
                      }
                    >
                      Claro
                    </span>
                  </motion.button>
                  <motion.button
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md ${
                      theme === "dark" ? "bg-neutral-600 shadow-sm" : ""
                    }`}
                    onClick={() => setTheme("dark")}
                    whileHover={{ scale: theme !== "dark" ? 1.03 : 1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Moon
                      className={`w-4 h-4 mr-2 ${
                        theme === "dark"
                          ? "text-indigo-300"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}
                    />
                    <span
                      className={
                        theme === "dark"
                          ? "text-white font-medium"
                          : "text-neutral-500 dark:text-neutral-400"
                      }
                    >
                      Oscuro
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2 border-b border-neutral-200 dark:border-neutral-700">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                      item.danger
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:pl-6"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:pl-6"
                    }`}
                    onClick={item.onClick}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.action && (
                      <motion.button
                        className="px-4 py-1 rounded-md bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-200 dark:bg-[linear-gradient(to_right,_#B2D0F9,_#F08878,_#FDC3B6,_#FFDB9A)] text-black font-medium text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onClick?.();
                        }}
                      >
                        {item.actionLabel}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200">
                <div className="flex items-center">
                  <motion.div
                    className="w-6 h-6 mr-2 bg-white dark:bg-neutral-700 rounded-full flex items-center justify-center shadow-sm"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                        fill={theme === "light" ? "black" : "white"}
                      />
                      <path
                        d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
                        fill={theme === "light" ? "black" : "white"}
                      />
                    </svg>
                  </motion.div>
                  <span className="text-neutral-900 dark:text-white font-medium">
                    UcoBot
                  </span>
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                  v1.0
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
