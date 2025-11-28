import cron from 'node-cron';
import { Note } from '../models/Note';

// Function to check and send notifications (3 days before the event)
export const checkAndSendNotifications = async (): Promise<void> => {
  try {
    const now = new Date();
    console.log(`Checking for notifications at: ${now}`);

    // Calculate the date 3 days from now
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find notes where notification date is exactly 3 days from now
    // and haven't been notified yet
    const notesToNotify = await Note.find({
      notificationDate: {
        $gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)), // Start of day 3 days from now
        $lt: new Date(threeDaysFromNow.setHours(23, 59, 59, 999)) // End of day 3 days from now
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
    Event Date: ${notificationDate ? notificationDate.toLocaleDateString() : 'N/A'}
    
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
  // Run every minute
  cron.schedule('* * * * *', checkAndSendNotifications);
  
  console.log('Notification scheduler started');
};