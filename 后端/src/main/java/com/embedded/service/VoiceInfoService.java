package com.embedded.service;

import com.alibaba.fastjson.JSONObject;
import com.embedded.entity.po.VoiceInfo;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface VoiceInfoService {
    void addVoice(VoiceInfo voice);

    JSONObject getVoiceList(Integer page, Integer pageSize);

    void deleteVoice(Integer voiceId);
}
