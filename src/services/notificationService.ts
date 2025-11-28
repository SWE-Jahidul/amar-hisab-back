import cron from 'node-cron';
import webPush from 'web-push';
import { Note } from '../models/Note';

// Web Push VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'your-public-vapid-key',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-vapid-key'
};

// Configure web-push with VAPID keys
webPush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory store for push subscriptions
const pushSubscriptions: any[] = [];

// Function to add push subscription
export const addPushSubscription = (subscription: any): void => {
  pushSubscriptions.push(subscription);
  console.log('New push subscription added');
};

// Function to get VAPID public key
export const getVapidPublicKey = (): string => {
  return vapidKeys.publicKey;
};

// Function to check and send notifications at exact user-selected time
export const checkAndSendNotifications = async (): Promise<void> => {
  try {
    const now = new Date();
    console.log(`Checking for notifications at: ${now.toISOString()}`);

    // Create a time window (current minute) to account for cron job timing
    const timeWindowStart = new Date(now.getTime() - 30000); // 30 seconds before
    const timeWindowEnd = new Date(now.getTime() + 30000);   // 30 seconds after

    // Find notes where notification date falls within current minute window
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
      
      console.log(`Notification sent for note: "${note.title}" at ${now.toISOString()}`);
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
    Reminder Time: ${notificationDate ? notificationDate.toLocaleString() : 'N/A'}
  `;
  
  console.log('NOTIFICATION:', notificationMessage);
  
  // Send push notifications to all subscribers
  await sendPushNotification(note);
};

// Function to send push notification
const sendPushNotification = async (note: any): Promise<void> => {
  const notificationDate = note.notificationDate ? new Date(note.notificationDate) : null;
  
  const payload = JSON.stringify({
    title: '📅 Note Reminder',
    body: `${note.title}\n${note.description}`,
    icon: '/icon.png',
    badge: '/badge.png',
    timestamp: notificationDate ? notificationDate.getTime() : Date.now(),
    data: {
      noteId: note._id.toString(),
      url: `/notes/${note._id}`
    },
    actions: [
      {
        action: 'view',
        title: 'View Note'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  });

  // Send to all subscribers
  const sendPromises = pushSubscriptions.map(async (subscription, index) => {
    try {
      await webPush.sendNotification(subscription, payload);
      console.log(`Push notification sent to subscriber ${index + 1}`);
    } catch (error: any) {
      console.error(`Error sending push notification to subscriber ${index + 1}:`, error);
      
      // Remove invalid subscriptions
      if (error.statusCode === 410) {
        pushSubscriptions.splice(index, 1);
        console.log('Removed invalid subscription');
      }
    }
  });

  await Promise.all(sendPromises);
};

// Function to send immediate test notification
export const sendTestNotification = async (): Promise<void> => {
  const payload = JSON.stringify({
    title: 'Test Notification',
    body: 'This is a test push notification from your notes app!',
    icon: '/icon.png',
    badge: '/badge.png'
  });

  const sendPromises = pushSubscriptions.map(async (subscription, index) => {
    try {
      await webPush.sendNotification(subscription, payload);
      console.log(`Test notification sent to subscriber ${index + 1}`);
    } catch (error: any) {
      console.error(`Error sending test notification to subscriber ${index + 1}:`, error);
    }
  });

  await Promise.all(sendPromises);
};

// Start the cron job to check notifications every minute
export const startNotificationScheduler = (): void => {
  cron.schedule('* * * * *', checkAndSendNotifications);
  console.log('Notification scheduler started - checking every minute');
};