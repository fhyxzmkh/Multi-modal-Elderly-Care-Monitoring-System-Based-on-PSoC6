package com.embedded.service;


public interface LLMService {
    String getDangerAnalysis(String text);

    String getHealthAnalysis();
}
