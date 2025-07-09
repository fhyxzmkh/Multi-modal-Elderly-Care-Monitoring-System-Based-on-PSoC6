package com.embedded.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeepSeekRequest {
    private String model;
    private List<Message> messages;
    private boolean stream;

    @Data
    @AllArgsConstructor
    public static class Message {
        private String role;
        private String content;
    }
}