package in.co.tracer.tracerrgt;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;



/**
 * This class is used for firebase notification.
 */

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = MyFirebaseMessagingService.class.getSimpleName();
    //Database database;
    String currentDate;

    boolean status = false;
    int countbadge = 0;
    SharedPreferences pref;
    SharedPreferences.Editor editor;
    String SoundUri;

    NotificationChannel notificationChannel = null;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        //Displaying data in log
        //It is optional
        super.onMessageReceived(remoteMessage);


        Log.e(TAG, "FORM :" + remoteMessage.getFrom());
        Log.e(TAG, "Notification Message Body :" + remoteMessage.getNotification());
        Log.e(TAG, "Notification Message Body :" + remoteMessage.getData().get("body"));

        try {
            Date d = Calendar.getInstance().getTime(); // Current time

            // SimpleDateFormat sdf1 = new SimpleDateFormat("yyyy-MM-dd HH:mm a"); // Set your date format
            SimpleDateFormat sdf1 = new SimpleDateFormat("dd-MM-yyyy HH:mm a"); // Set your date format


            currentDate = sdf1.format(d);


            try {

                if (remoteMessage.getData().size() > 0) {
                    Log.d(TAG, "Message data payload: " + remoteMessage.getData());
                    Map data = remoteMessage.getData();
                    String title = (String) data.get("title");
                    String body = (String) data.get("body");
                    SoundUri = (String) data.get("sound");
                    sendNotification(title, body, SoundUri);
                    Intent pushnotification = new Intent("SEND_NOTE");
                    pushnotification.putExtra("data", body);
                    sendBroadcast(pushnotification);
                    handleNotification(remoteMessage.getData().get("title"),
                            remoteMessage.getData().get("body"),
                            remoteMessage.getData().get("sound"),
                            "Received on " + currentDate);

                }
                // Check if message contains a notification payload.
                else if (remoteMessage.getNotification() != null) {
                    Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
                    Map data = remoteMessage.getData();
                    String str = (String) data.get("title");
                    sendNotification("", remoteMessage.getNotification().getBody(), remoteMessage.getNotification().getTitle());

                    SoundUri = remoteMessage.getNotification().getSound();

                    Intent pushnotification = new Intent("SEND_NOTE");
                    pushnotification.putExtra("data", remoteMessage.getNotification().getBody());
                    sendBroadcast(pushnotification);
                    handleNotification(remoteMessage.getData().get("title"),
                            remoteMessage.getData().get("body"),
                            remoteMessage.getData().get("sound"),
                            "Received on " + currentDate);
                }


                Log.e("SoundValue", SoundUri + "");
            } catch (Exception e) {
                e.printStackTrace();
            }


        } catch (Exception e) {

        }

    }

    private void handleNotification(String title,String message,String sound, String strdate) {

        if (!NotificationUtils.isAppIsInBackground(getApplicationContext())) {

            // App is in foreground
            Intent intent = new Intent("PUSHNOTIFICATION");
            intent.putExtra("title", title);
            intent.putExtra("body", message);
            intent.putExtra("sound", sound);
            intent.putExtra("notificationdate", strdate);

            // Send normal broadcast
            sendBroadcast(intent);

            // Optional: also show Android notification while app is foreground
         sendNotification(title, message,sound );
        }else {
            sendNotification(title, message,sound );

        }
    }


    private void sendNotification(String title, String messageBody, String sound) {
        Log.e("TAG", "sendNotification======");

        Uri soundplay;

        if (SoundUri == null ||
                SoundUri.trim().isEmpty() ||
                SoundUri.equalsIgnoreCase("default")) {

            // Play Android default notification sound
            soundplay = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        } else {

            Log.e("RingToneNotEmpty", SoundUri);

            // Get sound from res/raw using the name from backend
            int soundId = getResources().getIdentifier(
                    SoundUri,
                    "raw",
                    getPackageName()
            );

            if (soundId != 0) {
                soundplay = Uri.parse("android.resource://" + getPackageName() + "/" + soundId);
            } else {
                // If sound file doesn't exist, use default notification sound
                soundplay = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
        }

        Intent intent = new Intent(this, MainActivity.class);


        if (title != null && title.length() > 0 && !title.isEmpty())
            Log.e("TAG", "title notification =" + title);
        else
            title = "RGT Notification";


        intent.putExtra("Notificationcall", "1");
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 /* request code */, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent pendingIntent = null;

        //change for Android 13 and above

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingIntent = PendingIntent.getActivity(this, 0 /* request code */, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        } else {
            pendingIntent = PendingIntent.getActivity(this, 0 /* request code */, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT);
        }

        final String GROUP_KEY_EMAILS = "in.co.tracer.rgt.Notifications";

        String notificationChannelId =
                createNotificationChannel();

        NotificationCompat.Builder notificationCompatBuilder =
                new NotificationCompat.Builder(
                        getApplicationContext(), notificationChannelId);

      //  Uri sound = null;

        Log.e("SoundPlay", soundplay.toString()+" "+soundplay);


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {

            Log.e("TAG", "Lollipop and above");
            notificationCompatBuilder
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(messageBody)
                    .setAutoCancel(true)
                    .setColor(getResources().getColor(com.getcapacitor.android.R.color.colorPrimary))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody))
                    .setLights(Color.BLUE, 1, 1)
                    .setSound(soundplay)
                    .setGroupSummary(true)
                    .setGroup(GROUP_KEY_EMAILS)
                    // .setSound(null)
                    .setContentIntent(pendingIntent);
        } else {
            Log.e("TAG", "below Lollipop");
            notificationCompatBuilder
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(messageBody)
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody))
                    .setLights(Color.BLUE, 1, 1)
                    .setSound(soundplay)
                    .setGroupSummary(true)
                    .setGroup(GROUP_KEY_EMAILS)
                    // .setSound(null)
                    .setContentIntent(pendingIntent);
        }

        // Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName()+ "/" + R.raw.custom_ring);  //Here is FILE_NAME is the name of file that you want to play
        //  sound=Uri.parse("https://www.myinstants.com/media/sounds/beeper_emergency_call.mp3");


//          if(SoundUri.equalsIgnoreCase("default"))
//          {
//               sound=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
//               Ringtone r = RingtoneManager.getRingtone(getApplicationContext(), sound);
//               r.play();
//          }  else {
//
//               notificationCompatBuilder.setNotificationSilent();
//               sound = Uri.parse(SoundUri);
//               Ringtone r = RingtoneManager.getRingtone(getApplicationContext(), sound);
//               r.play();
//          }


        Notification notification = notificationCompatBuilder.build();
        NotificationManagerCompat mNotificationManagerCompat = NotificationManagerCompat.from(getApplicationContext());
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return;
        }
        mNotificationManagerCompat.notify((int) System.currentTimeMillis(), notification);

    }


    public String createNotificationChannel() {

        // NotificationChannels are required for Notifications on O (API 26) and above.

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            //  Log.e("cominginchangel","yea");

            String channelId = "notification_" + SoundUri;
            String channelName = "Channel_RGT";
            String channelDescription = "RGT Notifications";
            int  channelImportance = NotificationManager.IMPORTANCE_HIGH;

            notificationChannel =
                    new NotificationChannel(channelId, channelName, channelImportance);
            notificationChannel.setDescription(channelDescription);

            NotificationManager notificationManager =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);


            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

            Uri soundUri;

            if (SoundUri == null ||
                    SoundUri.trim().isEmpty() ||
                    SoundUri.equalsIgnoreCase("default")) {

                // Play Android default notification sound
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            } else {

                // Get sound from res/raw using the name from backend
                int soundId = getResources().getIdentifier(
                        SoundUri,
                        "raw",
                        getPackageName()
                );

                if (soundId != 0) {
                    soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + soundId);
                } else {
                    // If sound file doesn't exist, use default notification sound
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
            }


            notificationChannel.setSound(soundUri, audioAttributes);

            // notificationChannel.setSound(null,null);

            notificationManager.createNotificationChannel(notificationChannel);

            return channelId;
        } else {
            // Returns null for pre-O (26) devices.
            return null;

        }
    }


    private void showCustomNotification(String title, String body) {

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        RemoteViews customLayout =
                new RemoteViews(getPackageName(), R.layout.custom_notification);

        customLayout.setTextViewText(R.id.notification_title, title);
        customLayout.setTextViewText(R.id.notification_body, body);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, "default")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                        .setCustomContentView(customLayout)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true);

        notificationManager.notify(
                (int) System.currentTimeMillis(),
                builder.build()
        );
    }
    @Override
    public void onNewToken(@NonNull String refreshToken) {
        super.onNewToken(refreshToken);

        Log.e("TAG","refreshToken=="+refreshToken);



    }
}