package com.juampi.tv;

import android.view.KeyEvent;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.io.File;
import java.io.FileOutputStream;
import android.graphics.Bitmap;

@RunWith(AndroidJUnit4.class)
public class TvSmokeTest {
    @Rule public ActivityTestRule<MainActivity> activity = new ActivityTestRule<>(MainActivity.class);
    private String js(String script) throws Throwable {
        CountDownLatch ready = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>("");
        activity.runOnUiThread(() -> activity.getActivity().web.evaluateJavascript(script, result -> {value.set(result);ready.countDown();}));
        assertTrue("WebView no responde",ready.await(10,TimeUnit.SECONDS));
        return value.get();
    }
    private void waitJs(String expression) throws Throwable {
        long until=System.currentTimeMillis()+30000;
        while(System.currentTimeMillis()<until){if("true".equals(js(expression)))return;Thread.sleep(250);}
        fail("No se cumplió: "+expression);
    }
    private void screenshot(String name) throws Exception {
        Bitmap bitmap=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        File file=new File(activity.getActivity().getExternalFilesDir(null),name+".png");
        try(FileOutputStream stream=new FileOutputStream(file)){bitmap.compress(Bitmap.CompressFormat.PNG,100,stream);}
    }
    @Test public void remoteNavigationCatalogAndNativePlayback() throws Throwable {
        waitJs("document.querySelectorAll('.card').length > 0");
        assertEquals("true",js("document.documentElement.classList.contains('tv')"));
        assertEquals("true",js("!!window.JuampiNative"));
        js("document.querySelector('[data-view=all]').click(); document.querySelector('[data-play]').focus(); true");
        String first=js("document.activeElement.getAttribute('aria-label')");
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_RIGHT);
        assertNotEquals("La flecha debe mover el foco",first,js("document.activeElement.getAttribute('aria-label')"));
        js("document.querySelector('[data-favorite]').click(); true");
        assertEquals("true",js("JSON.parse(localStorage.getItem('jtv-favorites')).length > 0"));
        screenshot("tv-catalog");
        js("JuampiNative.postMessage(JSON.stringify({action:'play',url:'https://example.invalid/test.m3u8',name:'Prueba de integración'})); true");
        Thread.sleep(500);
        activity.runOnUiThread(() -> {assertNotNull("El mensaje web debe abrir el reproductor nativo",activity.getActivity().player);activity.getActivity().closePlayback();});
        // Native decoding is tested with a bundled debug-only media fixture, independent of broadcasters.
        activity.runOnUiThread(() -> activity.getActivity().startPlayback("asset:///test-video.mp4","Prueba local"));
        long until=System.currentTimeMillis()+20000;
        AtomicReference<Boolean> decoded=new AtomicReference<>(false);
        while(System.currentTimeMillis()<until){
            activity.runOnUiThread(() -> {if(activity.getActivity().player!=null)decoded.set(activity.getActivity().player.getVideoSize().width>0 && activity.getActivity().player.getCurrentPosition()>200);});
            if(decoded.get())break;Thread.sleep(250);
        }
        assertTrue("El reproductor nativo debe decodificar el video",decoded.get());
        screenshot("tv-native-player");
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
        Thread.sleep(500);
        activity.runOnUiThread(() -> assertNull("Atrás debe liberar el reproductor",activity.getActivity().player));
        assertEquals("true",js("document.querySelectorAll('.card').length > 0"));
        // Invalid protocols must never reach an external app or the native player.
        js("JuampiNative.postMessage(JSON.stringify({action:'play',url:'javascript:alert(1)'})); true");
        Thread.sleep(300);
        activity.runOnUiThread(() -> assertNull(activity.getActivity().player));
    }
}
