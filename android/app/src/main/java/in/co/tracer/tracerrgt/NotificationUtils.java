package in.co.tracer.tracerrgt;

import android.app.ActivityManager;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.Context;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import java.util.List;


public class NotificationUtils {
     Context mContext;
     
     public NotificationUtils(Context mContext) {
          this.mContext = mContext;
     }
     
     /**
      * Method checks if the app is in background or not
      */
     public static boolean isAppIsInBackground(Context context) {
          boolean isInBackground = true;
          ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
          if (Build.VERSION.SDK_INT > Build.VERSION_CODES.KITKAT_WATCH) {
               List<ActivityManager.RunningAppProcessInfo> runningProcesses = am.getRunningAppProcesses();
               for (ActivityManager.RunningAppProcessInfo processInfo : runningProcesses) {
                    if (processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
                         for (String activeProcess : processInfo.pkgList) {
                              if (activeProcess.equals(context.getPackageName())) {
                                   isInBackground = false;
                              }
                         }
                    }
               }
          } else {
               List<ActivityManager.RunningTaskInfo> taskInfo = am.getRunningTasks(1);
               ComponentName componentInfo = taskInfo.get(0).topActivity;
               if (componentInfo.getPackageName().equals(context.getPackageName())) {
                    isInBackground = false;
               }
          }
          
          return isInBackground;
     }
     
     // Clears notification tray messages
     public static void clearNotifications(Context context) {
          NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
          notificationManager.cancelAll();
     }
     
     // Playing notification sound
     public void playNotificationSound() {
          try {
               Uri alarmSound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE
                                                  + "://" + mContext.getPackageName() + "/raw/notification");
               Ringtone r = RingtoneManager.getRingtone(mContext, alarmSound);
               r.play();
          } catch (Exception e) {
               e.printStackTrace();
          }
     }
}
