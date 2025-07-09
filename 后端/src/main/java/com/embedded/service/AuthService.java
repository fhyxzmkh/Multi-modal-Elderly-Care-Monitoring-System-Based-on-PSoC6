package com.embedded.service;

import com.embedded.entity.dto.LoginDto;
import com.embedded.entity.dto.RegisterDto;

import java.util.Map;


public interface AuthService {
    String login(LoginDto loginDto);

    Map register(RegisterDto registerDto);
}
