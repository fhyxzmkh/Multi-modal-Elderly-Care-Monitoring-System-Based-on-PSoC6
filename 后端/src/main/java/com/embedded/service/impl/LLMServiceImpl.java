package com.embedded.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.embedded.entity.dto.DeepSeekRequest;
import com.embedded.entity.dto.DeepSeekResponse;
import com.embedded.entity.po.PhysiologicalInfo;
import com.embedded.mapper.PhysiologicalInfoMapper;
import com.embedded.service.LLMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


import java.util.ArrayList;
import java.util.List;

@Service
public class LLMServiceImpl implements LLMService {

    @Value("${deepseek.api.url}")
    private String deepseekApiUrl;

    @Value("${deepseek.api.key}")
    private String deepseekApiKey;

    @Value("${deepseek.api.model}")
    private String deepseekApiModel;

    private static final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private PhysiologicalInfoMapper physiologicalInfoMapper;

    public String chatCompletion(String userMessage) {
        // 1. 构造请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + deepseekApiKey);

        // 2. 构造请求体
        DeepSeekRequest request = new DeepSeekRequest();
        request.setModel(deepseekApiModel);
        request.setStream(false);

        DeepSeekRequest.Message message = new DeepSeekRequest.Message("user", userMessage);
        request.setMessages(List.of(message));

        // 3. 发送请求
        HttpEntity<DeepSeekRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<DeepSeekResponse> response = restTemplate.exchange(
                deepseekApiUrl,
                HttpMethod.POST,
                entity,
                DeepSeekResponse.class
        );

        // 4. 处理响应
        if (response.getStatusCode() == HttpStatus.OK &&
                response.getBody() != null &&
                !response.getBody().getChoices().isEmpty()) {
            return response.getBody().getChoices().get(0).getMessage().getContent();
        }

        throw new RuntimeException("Failed to get response from DeepSeek API");
    }

    @Override
    public String getDangerAnalysis(String text) {
        String prompt = "请分析以下文本是否可能是用户呼救（0否 1是），并给出置信度（两位小数）：\n" +
                text + "\n" +
                "按照固定的json格式返回，比如：{\"is_danger\":1,\"confidence\":0.92}";

        return chatCompletion(prompt);
    }

    @Override
    public String getHealthAnalysis() {
        IPage<PhysiologicalInfo> physiologicalInfoIPage = new Page<>(1, 30);
        QueryWrapper<PhysiologicalInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", 300);
        queryWrapper.orderByDesc("id");
        List<PhysiologicalInfo> physiologicalInfoList = physiologicalInfoMapper.selectPage(physiologicalInfoIPage, queryWrapper).getRecords();

        ArrayList<Double> heartRateList = new ArrayList<>();
        for (PhysiologicalInfo physiologicalInfo : physiologicalInfoList) {
            heartRateList.add(physiologicalInfo.getHeartRate());
        }

        String prompt = "已知用户近期的心率数据：\n" +
                JSONObject.toJSONString(heartRateList) + "\n" +
                "请分析预测用户的健康状况，以文本形式返回结果。";

        return chatCompletion(prompt);
    }
}
