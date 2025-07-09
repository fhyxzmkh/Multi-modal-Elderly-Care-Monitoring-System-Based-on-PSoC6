package com.embedded.service;

import com.alibaba.fastjson.JSONObject;
import com.embedded.entity.po.MessageInfo;

public interface MessageInfoService {

    Long getUnconfirmedMessagesCount();

    void addMessage(MessageInfo messageInfo);

    void confirmMessage(Integer messageId);

    JSONObject getMessageList(Integer page, Integer pageSize);

    void deleteMessage(Integer messageId);
}
