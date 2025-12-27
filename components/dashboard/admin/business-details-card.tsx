import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin, Phone, Mail, Globe, Store, Clock, Share2, Utensils, CalendarDays, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserEditDialog } from "./user-edit-dialog"

export function BusinessDetailsCard({ profile }: { profile: any }) {
  const {
    business_description,
    location,
    business_info,
    menu_link,
    business_hours,
    social_links,
    business_name
  } = profile

  const phone = business_info?.phone
  const email = business_info?.email
  const website = business_info?.website

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  const dayNames: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
    friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  }

  // Helper to check if open now
  const isOpenNow = () => {
    if (!business_hours) return false;
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sunday
    const currentDay = days[dayIndex === 0 ? 6 : dayIndex - 1];
    const schedule = business_hours[currentDay];
    
    if (!schedule || !schedule.isOpen) return false;
    
    // Simple check based on hours, ignoring minutes for simplicity or parsing fully if needed
    // Let's do a basic string comparison for now or just rely on the "isOpen" flag for the day + current time check
    // For robust checking we'd parse the time strings.
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = schedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = schedule.close.split(':').map(Number);
    
    if (isNaN(openHour) || isNaN(closeHour)) return false;

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openTime && currentTime <= closeTime;
  }

  const isBusinessOpen = isOpenNow();

  return (
    <Card className="h-full shadow-md border-0 bg-gradient-to-br from-card to-green-50/30 dark:to-green-950/10 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 w-full" />
      <CardHeader className="pb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
              {business_name || "Información del Negocio"}
            </CardTitle>
            <CardDescription className="text-base max-w-2xl">
              {business_description || "Sin descripción disponible."}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={isBusinessOpen ? "default" : "secondary"} className={isBusinessOpen ? "bg-green-500 hover:bg-green-600" : ""}>
              {isBusinessOpen ? "Abierto Ahora" : "Cerrado"}
            </Badge>
            <UserEditDialog profile={profile}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-600">
                <Pencil className="h-4 w-4" />
              </Button>
            </UserEditDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contact & Details (2 cols wide on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="font-medium">{location || "No especificada"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p className="font-medium">{phone || "No especificado"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                {email ? (
                  <a href={`mailto:${email}`} className="font-medium hover:underline truncate block max-w-[200px]">{email}</a>
                ) : (
                  <p className="text-muted-foreground italic">No especificado</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sitio Web</p>
                {website ? (
                  <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline truncate block max-w-[200px]">
                    {website}
                  </a>
                ) : (
                  <p className="text-muted-foreground italic">No especificado</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions & Socials */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Enlaces y Redes</h3>
            <div className="flex flex-wrap gap-3">
              {menu_link && (
                <Button variant="outline" className="gap-2 hover:text-green-600 hover:border-green-200" asChild>
                  <a href={menu_link} target="_blank" rel="noopener noreferrer">
                    <Utensils className="h-4 w-4 text-green-500" />
                    Ver Menú Digital
                  </a>
                </Button>
              )}
              
              {social_links && Object.entries(social_links).map(([platform, url]: [string, any]) => (
                url && (
                  <Button key={platform} variant="outline" size="sm" className="gap-2 capitalize hover:text-green-600 hover:border-green-200" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Share2 className="h-3 w-3" />
                      {platform}
                    </a>
                  </Button>
                )
              ))}
              
              {(!social_links || Object.keys(social_links).length === 0) && !menu_link && (
                <p className="text-sm text-muted-foreground italic">No hay enlaces configurados.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Hours */}
        <div className="bg-card rounded-xl border shadow-sm p-5 h-fit">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Horarios de Atención</h3>
          </div>
          
          <div className="space-y-3">
            {business_hours ? (
              days.map(day => {
                const schedule = business_hours[day]
                const now = new Date();
                const dayIndex = now.getDay(); // 0 = Sunday
                const currentDayIndex = days.indexOf(day);
                const isToday = (dayIndex === 0 ? 6 : dayIndex - 1) === currentDayIndex;
                
                return (
                  <div key={day} className={`flex justify-between items-center text-sm p-2 rounded-md transition-colors ${isToday ? 'bg-green-50 dark:bg-green-900/20 font-medium text-green-700 dark:text-green-300' : 'hover:bg-muted/50'}`}>
                    <span className="capitalize w-24 flex items-center gap-2">
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                      {dayNames[day]}
                    </span>
                    <span className={schedule?.isOpen ? "" : "text-muted-foreground/60 italic"}>
                      {schedule?.isOpen 
                        ? `${schedule.open} - ${schedule.close}` 
                        : "Cerrado"
                      }
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Horarios no configurados
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
