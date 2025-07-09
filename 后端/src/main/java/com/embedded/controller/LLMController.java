package com.embedded.controller;

import com.embedded.controller.common.ABaseController;
import com.embedded.entity.vo.ResponseVO;
import com.embedded.service.LLMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/llm")
public class LLMController extends ABaseController {

    @Autowired
    private LLMService llmService;

    @GetMapping("/analysis/danger")
    public ResponseVO getDangerAnalysis(@RequestParam String text) {
        return getSuccessResponseVO(llmService.getDangerAnalysis(text));
    }

    @GetMapping("/analysis/health")
    public ResponseVO getHealthAnalysis() {
        return getSuccessResponseVO(llmService.getHealthAnalysis());
    }

}
