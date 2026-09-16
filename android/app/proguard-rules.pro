# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Capacitor Core & Plugin Interfaces
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.Bridge { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# JavascriptInterface annotations used for WebView JS-to-Java communication
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Capacitor Community / Official Plugins
-keep class com.capacitorjs.** { *; }
-keep class androidx.core.content.FileProvider { *; }

# Cordova Plugin Compatibility
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }

# Suppress harmless warnings for missing optional classes
-dontwarn com.google.android.gms.**
-dontwarn org.apache.cordova.**
