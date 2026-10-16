package in.co.tracer.tracerrgt;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;

import androidx.activity.EdgeToEdge;
import androidx.core.app.NotificationCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        EdgeToEdge.enable(this);

        super.onCreate(savedInstanceState);

        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }


        ViewCompat.setOnApplyWindowInsetsListener(
                findViewById(android.R.id.content), // Root view of the activity
                (v, windowInsets) -> {
                    Insets gestureInsets = windowInsets.getInsets(WindowInsetsCompat.Type.systemGestures());
                    Insets systemInsets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());

                    // Apply padding dynamically
                    v.setPadding(
                            0,
                            systemInsets.top,
                            0,
                            gestureInsets.bottom
                    );

                    return WindowInsetsCompat.CONSUMED;
                }
        );



        FirebaseApp.initializeApp(this);
        FirebaseMessaging firebaseMessaging = FirebaseMessaging.getInstance();


    }



}