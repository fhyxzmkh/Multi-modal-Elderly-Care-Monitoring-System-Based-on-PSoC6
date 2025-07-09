package com.embedded.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.embedded.entity.po.VoiceInfo;
import com.embedded.mapper.VoiceInfoMapper;
import com.embedded.service.VoiceInfoService;
import com.embedded.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class VoiceInfoServiceImpl implements VoiceInfoService {

    @Autowired
    private VoiceInfoMapper voiceInfoMapper;

    @Override
    public void addVoice(VoiceInfo voice) {
        voice.setUserId(SecurityUtils.getLoginUser().getId());
        voiceInfoMapper.insert(voice);
    }

    @Override
    public JSONObject getVoiceList(Integer page, Integer pageSize) {
        // TODO jwt

        IPage<VoiceInfo> recordIPage = new Page<>(page, pageSize);
        QueryWrapper<VoiceInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", SecurityUtils.getLoginUser().getId());
        queryWrapper.orderByDesc("id");

        JSONObject result = new JSONObject();
        result.put("total", voiceInfoMapper.selectCount(null));
        result.put("rows", voiceInfoMapper.selectPage(recordIPage, queryWrapper).getRecords());

        return result;
    }

    @Override
    public void deleteVoice(Integer voiceId) {
        voiceInfoMapper.deleteById(voiceId);
    }

}
