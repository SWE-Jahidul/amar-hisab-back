import cron from 'node-cron';
import { Note } from '../models/Note';

// Function to check and send notifications (exactly 3 days before the event datetime)
export const checkAndSendNotifications = async (): Promise<void> => {
  try {
    const now = new Date();
    console.log(`Checking for notifications at: ${now.toISOString()}`);

    // Calculate the exact datetime 3 days from now
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    // Create a time window (e.g., ±1 minute) to account for cron job timing
    const timeWindowStart = new Date(threeDaysFromNow.getTime() - 60000); // 1 minute before
    const timeWindowEnd = new Date(threeDaysFromNow.getTime() + 60000);   // 1 minute after

    // Find notes where notification date falls within our 3-day window
    // and haven't been notified yet
    const notesToNotify = await Note.find({
      notificationDate: {
        $gte: timeWindowStart,
        $lte: timeWindowEnd
      },
      isNotified: false
    });

    console.log(`Found ${notesToNotify.length} notes to notify`);

    for (const note of notesToNotify) {
      await sendNotification(note);
      
      // Mark as notified
      note.isNotified = true;
      await note.save();
      
      console.log(`Notification sent for note: ${note.title}`);
    }
  } catch (error) {
    console.error('Error in notification service:', error);
  }
};

// Function to send notification
const sendNotification = async (note: any): Promise<void> => {
  const notificationDate = note.notificationDate ? new Date(note.notificationDate) : null;
  
  const notificationMessage = `
    🔔 NOTE REMINDER 🔔
    
    Title: ${note.title}
    Description: ${note.description}
    Event Date & Time: ${notificationDate ? notificationDate.toLocaleString() : 'N/A'}
    
    This is your 3-day reminder for this event!
  `;
  
  console.log('NOTIFICATION:', notificationMessage);
  
  // Here you can integrate with:
  // - Email services (Nodemailer)
  // - Push notifications
  // - SMS services
  // - WebSocket for real-time notifications
};

// Start the cron job to check notifications every minute
export const startNotificationScheduler = (): void => {
  // Run every minute to check for notifications
  cron.schedule('* * * * *', checkAndSendNotifications);
  
  console.log('Notification scheduler started - checking every minute');
};