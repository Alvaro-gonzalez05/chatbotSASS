import { createAdminClient } from "@/lib/supabase/server";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  metadata?: any;
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  link,
  metadata
}: CreateNotificationParams) {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        metadata,
        read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating notification:', error);
    return false;
  }
}
