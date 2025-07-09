package com.embedded.controller;

import com.embedded.controller.common.ABaseController;
import com.embedded.entity.dto.LoginDto;
import com.embedded.entity.dto.RegisterDto;
import com.embedded.entity.vo.ResponseVO;
import com.embedded.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController extends ABaseController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    ResponseVO login(@RequestBody LoginDto loginDto) {
        return getSuccessResponseVO(authService.login(loginDto));
    }


    @PostMapping("/register")
    ResponseVO register(@RequestBody RegisterDto registerDto) {
        return getSuccessResponseVO(authService.register(registerDto));
    }
}
