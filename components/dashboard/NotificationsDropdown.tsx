"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Clock, Settings, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Datos mock de notificaciones - después puedes conectar con Supabase
const mockNotifications = [
  {
    id: 1,
    title: "Nuevo cliente registrado",
    message: "Juan Pérez se ha registrado en tu sistema",
    time: "Hace 5 min",
    read: false,
    type: "success"
  },
  {
    id: 2,
    title: "Bot actualizado",
    message: "El bot 'Atención al Cliente' ha sido actualizado correctamente",
    time: "Hace 1 hora",
    read: false,
    type: "info"
  },
  {
    id: 3,
    title: "Mensaje automatizado enviado",
    message: "Se enviaron 25 mensajes promocionales",
    time: "Hace 2 horas",
    read: true,
    type: "success"
  },
  {
    id: 4,
    title: "Error en automatización",
    message: "La automatización 'Seguimiento' falló al ejecutarse",
    time: "Hace 3 horas",
    read: false,
    type: "error"
  },
];

export default function NotificationsDropdown() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
      >
        <Bell className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
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
              className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 max-h-[80vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-white shadow-lg dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                    Notificaciones
                  </h3>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span className="hidden sm:inline">Marcar todas como leídas</span>
                      <span className="sm:hidden">Marcar todas</span>
                    </button>
                    <button className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-500 dark:text-neutral-400" />
                    </button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                  </p>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className={`p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getTypeColor(notification.type)}`} />
                            <h4 className={`text-xs sm:text-sm font-medium ${
                              !notification.read 
                                ? 'text-neutral-900 dark:text-white' 
                                : 'text-neutral-600 dark:text-neutral-300'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center text-xs text-neutral-400 dark:text-neutral-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {notification.time}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Eliminar notificación"
                          >
                            <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400">
                      No tienes notificaciones
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}