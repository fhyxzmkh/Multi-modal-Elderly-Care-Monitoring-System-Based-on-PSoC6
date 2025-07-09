package com.embedded.controller;

import com.embedded.controller.common.ABaseController;
import com.embedded.entity.po.MessageInfo;
import com.embedded.entity.vo.ResponseVO;
import com.embedded.service.MessageInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/message")
public class MessageController extends ABaseController {

    @Autowired
    private MessageInfoService messageInfoService;

    @GetMapping("/count/unconfirmed")
    public ResponseVO getUnconfirmedMessagesCount() {
        return getSuccessResponseVO(messageInfoService.getUnconfirmedMessagesCount());
    }

    @GetMapping("/get/list")
    public ResponseVO getMessageList(@RequestParam Integer page, @RequestParam Integer pageSize) {
        return getSuccessResponseVO(messageInfoService.getMessageList(page, pageSize));
    }

    @PostMapping("/add")
    public ResponseVO addMessage(@RequestBody MessageInfo messageInfo) {
        messageInfoService.addMessage(messageInfo);
        return getSuccessResponseVO(null);
    }

    @PostMapping("/update/confirm")
    public ResponseVO confirmMessage(@RequestParam Integer messageId) {
        messageInfoService.confirmMessage(messageId);
        return getSuccessResponseVO(null);
    }

    @PostMapping("/delete")
    public ResponseVO deleteMessage(@RequestParam Integer messageId) {
        messageInfoService.deleteMessage(messageId);
        return getSuccessResponseVO(null);
    }
}
