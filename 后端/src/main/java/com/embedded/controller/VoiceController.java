package com.embedded.controller;

import com.embedded.controller.common.ABaseController;
import com.embedded.entity.po.VoiceInfo;
import com.embedded.entity.vo.ResponseVO;
import com.embedded.service.VoiceInfoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/voice")
@Slf4j
public class VoiceController extends ABaseController {

    @Autowired
    private VoiceInfoService voiceInfoService;

    @PostMapping("/add")
    public ResponseVO addVoice(@RequestBody VoiceInfo voice) {
        voiceInfoService.addVoice(voice);
        return getSuccessResponseVO(null);
    }

    @GetMapping("/get/list")
    public ResponseVO getVoiceList(@RequestParam Integer page, @RequestParam Integer pageSize) {
        return getSuccessResponseVO(voiceInfoService.getVoiceList(page, pageSize));
    }

    @PostMapping("/delete")
    public ResponseVO deleteVoice(@RequestParam Integer voiceId) {
        voiceInfoService.deleteVoice(voiceId);
        return getSuccessResponseVO(null);
    }

}
