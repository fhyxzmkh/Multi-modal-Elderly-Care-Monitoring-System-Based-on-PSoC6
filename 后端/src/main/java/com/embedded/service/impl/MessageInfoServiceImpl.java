package com.embedded.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.embedded.entity.po.MessageInfo;
import com.embedded.mapper.MessageInfoMapper;
import com.embedded.service.MessageInfoService;
import com.embedded.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageInfoServiceImpl implements MessageInfoService {

    @Autowired
    private MessageInfoMapper messageInfoMapper;

    @Override
    public Long getUnconfirmedMessagesCount() {
        QueryWrapper<MessageInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("is_confirmed", 0);

        return messageInfoMapper.selectCount(queryWrapper);
    }

    @Override
    public void addMessage(MessageInfo messageInfo) {
        messageInfo.setUserId(SecurityUtils.getLoginUser().getId());
        messageInfoMapper.insert(messageInfo);
    }

    @Override
    public void confirmMessage(Integer messageId) {
        UpdateWrapper<MessageInfo> updateWrapper = new UpdateWrapper<>();
        updateWrapper.eq("id", messageId);
        updateWrapper.set("is_confirmed", 1);
        messageInfoMapper.update(updateWrapper);
    }

    @Override
    public JSONObject getMessageList(Integer page, Integer pageSize) {
        IPage<MessageInfo> pageInfo = new Page<>(page, pageSize);
        QueryWrapper<MessageInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", SecurityUtils.getLoginUser().getId());
        queryWrapper.orderByDesc("id");

        JSONObject result = new JSONObject();
        result.put("total", messageInfoMapper.selectCount(queryWrapper));
        result.put("rows", messageInfoMapper.selectPage(pageInfo, queryWrapper).getRecords());

        return result;
    }

    @Override
    public void deleteMessage(Integer messageId) {
        messageInfoMapper.deleteById(messageId);
    }

}
