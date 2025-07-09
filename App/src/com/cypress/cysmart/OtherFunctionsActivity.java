package com.cypress.cysmart;

import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class OtherFunctionsActivity extends AppCompatActivity {
    private WebView mWebView;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_other_functions);

        mWebView = findViewById(R.id.webview_other);
        WebSettings webSettings = mWebView.getSettings();

        // 启用必要设置
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // 启用 localStorage
        webSettings.setDatabaseEnabled(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // 设置 WebViewClient（处理页面加载、SSL 错误）
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed(); // ⚠️ 忽略 SSL 错误（仅限测试环境！）
            }
        });

        // 设置 WebChromeClient（处理 JavaScript 控制台日志、弹窗等）
        mWebView.setWebChromeClient(new WebChromeClient() {
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.e("WebViewConsole",
                        "JS Error: " + consoleMessage.message() +
                                " at " + consoleMessage.sourceId() +
                                ":" + consoleMessage.lineNumber());
                return true;
            }
        });

        // 加载 URL
        mWebView.loadUrl("https://elderly-care-aiot.pages.dev/");
    }

    @Override
    public void onBackPressed() {
        // 如果 WebView 有历史页面，就先后退
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
