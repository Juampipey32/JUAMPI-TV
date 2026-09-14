package com.juampi.tv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.util.Collections;

@androidx.annotation.OptIn(markerClass = androidx.media3.common.util.UnstableApi.class)
public class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private FrameLayout root;
    WebView web;
    ExoPlayer player;
    private FrameLayout playback;
    private PlayerView playerView;
    private LinearLayout errorPanel;
    private TextView playbackStatus;
    private ValueCallback<Uri[]> fileCallback;
    private boolean resumePlayback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        root = new FrameLayout(this);
        web = new WebView(this);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.setBackgroundColor(Color.rgb(16,18,16));
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " JuampiTV/0.2.0");
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())) return false;
                if (request.isForMainFrame()) openExternal(uri);
                return true;
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "JuampiNative", Collections.singleton(ORIGIN),
                (view, message, origin, isMainFrame, reply) -> {
                    if (!isMainFrame) return;
                    try {
                        JSONObject data = new JSONObject(message.getData());
                        if ("play".equals(data.optString("action"))) {
                            Uri uri = Uri.parse(data.optString("url"));
                            if (validUrl(uri)) startPlayback(uri.toString(), data.optString("name", "JUAMPI-TV"));
                        } else if ("external".equals(data.optString("action"))) {
                            openExternal(Uri.parse(data.optString("url")));
                        }
                    } catch (Exception ignored) { Toast.makeText(MainActivity.this,"No se pudo abrir la señal.",Toast.LENGTH_SHORT).show(); }
                });
        } else {
            new AlertDialog.Builder(this).setTitle("Actualizá Android System WebView")
                .setMessage("Esta versión del reproductor necesita Android System WebView actualizado desde Play Store.")
                .setPositiveButton("Entendido", (dialog, which) -> {}).show();
        }
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(intent, 40); }
                catch (ActivityNotFoundException e) { fileCallback.onReceiveValue(null); fileCallback=null; Toast.makeText(MainActivity.this,"Esta TV no tiene selector de archivos. Usá la URL de la lista.",Toast.LENGTH_LONG).show(); }
                return true;
            }
        });
        web.loadUrl(ORIGIN + "/index.html?tv=1");
        web.requestFocus();
    }

    private boolean validUrl(Uri uri) {
        return ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) && uri.getHost() != null;
    }
    private void openExternal(Uri uri) {
        if (!validUrl(uri)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (ActivityNotFoundException e) { Toast.makeText(this,"No hay una aplicación disponible para abrir esta fuente.",Toast.LENGTH_LONG).show(); }
    }

    void startPlayback(String url, String title) {
        closePlayback();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        playback = new FrameLayout(this);
        playback.setBackgroundColor(Color.BLACK);
        playerView = new PlayerView(this);
        playerView.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);
        playerView.setControllerShowTimeoutMs(5000);
        playerView.setUseController(true);
        playback.addView(playerView, new FrameLayout.LayoutParams(-1,-1));
        LinearLayout heading = new LinearLayout(this);
        heading.setOrientation(LinearLayout.VERTICAL);
        heading.setPadding(dp(28),dp(14),dp(28),dp(14));
        heading.setBackgroundColor(0x99000000);
        TextView name = new TextView(this);
        name.setText(title); name.setTextSize(21); name.setTextColor(0xffd4fa46);
        heading.addView(name);
        playbackStatus = new TextView(this);
        playbackStatus.setText("Conectando… · OK: controles · Atrás: volver a canales");
        playbackStatus.setTextColor(Color.WHITE); playbackStatus.setTextSize(13);
        heading.addView(playbackStatus);
        playback.addView(heading, new FrameLayout.LayoutParams(-1,-2,Gravity.TOP));
        playerView.setControllerVisibilityListener((PlayerView.ControllerVisibilityListener) visibility -> heading.setVisibility(visibility));
        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL); errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(dp(24),dp(24),dp(24),dp(24)); errorPanel.setBackgroundColor(0xf0101210);
        TextView error = new TextView(this);
        error.setText("Esta señal no está disponible ahora.\nPuede estar caída o restringida en tu región.");
        error.setTextColor(Color.WHITE); error.setTextSize(19); error.setGravity(Gravity.CENTER);
        errorPanel.addView(error);
        Button retry = new Button(this); retry.setText("Reintentar");
        retry.setOnClickListener(v -> { errorPanel.setVisibility(View.GONE); player.prepare(); player.play(); playerView.requestFocus(); });
        errorPanel.addView(retry);
        Button back = new Button(this); back.setText("Volver a canales"); back.setOnClickListener(v -> closePlayback()); errorPanel.addView(back);
        errorPanel.setVisibility(View.GONE);
        playback.addView(errorPanel,new FrameLayout.LayoutParams(-1,-2,Gravity.CENTER));
        root.addView(playback,new FrameLayout.LayoutParams(-1,-1));
        player = new ExoPlayer.Builder(this).build();
        player.setAudioAttributes(new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),true);
        player.setHandleAudioBecomingNoisy(true);
        playerView.setPlayer(player);
        player.addListener(new Player.Listener() {
            @Override public void onIsPlayingChanged(boolean playing) {
                if (playbackStatus != null) playbackStatus.setText(playing ? "EN VIVO · OK: controles · Atrás: volver a canales" : "Pausado / cargando · OK: controles");
            }
            @Override public void onPlayerError(PlaybackException failure) {
                if (errorPanel != null) { errorPanel.setVisibility(View.VISIBLE); retry.requestFocus(); }
            }
        });
        player.setMediaItem(MediaItem.fromUri(url)); player.prepare(); player.play();
        playerView.requestFocus(); playerView.showController();
    }

    void closePlayback() {
        resumePlayback=false;
        if (player != null) { player.release(); player=null; }
        if (playback != null) { root.removeView(playback); playback=null; }
        playerView=null; errorPanel=null; playbackStatus=null;
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (web != null) { web.requestFocus(); web.evaluateJavascript("window.juampiNativeClosed?.()",null); }
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (player != null && playerView != null && playerView.dispatchMediaKeyEvent(event)) return true;
        if (player == null && web != null) {
            String direction = switch(event.getKeyCode()) {
                case KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp";
                case KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown";
                case KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft";
                case KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight";
                case KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> "Enter";
                default -> null;
            };
            if (direction != null) {
                if (event.getAction() == KeyEvent.ACTION_DOWN) {
                    KeyEvent original = new KeyEvent(event);
                    web.evaluateJavascript("window.juampiRemote ? window.juampiRemote('"+direction+"') : false", handled -> {
                        if (!"true".equals(handled)) {
                            // Editable inputs and native select popups keep the WebView's normal key behavior.
                            web.dispatchKeyEvent(original);
                            web.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, original.getKeyCode()));
                        }
                    });
                }
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }
    @Override public void onBackPressed() {
        if (player != null) { closePlayback(); return; }
        web.evaluateJavascript("window.juampiBack ? window.juampiBack() : false", result -> {
            if (!"true".equals(result)) new AlertDialog.Builder(this).setTitle("¿Salir de JUAMPI-TV?")
                .setNegativeButton("Seguir mirando",null).setPositiveButton("Salir",(dialog, which)->finish()).show();
        });
    }
    @Override protected void onStop() { super.onStop(); if(player!=null){resumePlayback=player.getPlayWhenReady();player.pause();} web.onPause(); }
    @Override protected void onStart() { super.onStart(); if(web!=null)web.onResume(); if(player!=null&&resumePlayback)player.play(); }
    @Override protected void onDestroy() { closePlayback(); if(fileCallback!=null)fileCallback.onReceiveValue(null); web.destroy(); super.onDestroy(); }
    @Override protected void onActivityResult(int request, int result, Intent data) { super.onActivityResult(request,result,data); if(request==40&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;} }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
}
