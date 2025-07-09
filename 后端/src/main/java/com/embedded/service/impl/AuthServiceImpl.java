package com.embedded.service.impl;

import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.embedded.config.security.UserDetailsImpl;
import com.embedded.entity.dto.LoginDto;
import com.embedded.entity.dto.RegisterDto;
import com.embedded.entity.po.UserInfo;
import com.embedded.exception.BusinessException;
import com.embedded.mapper.UserInfoMapper;
import com.embedded.service.AuthService;
import com.embedded.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserInfoMapper userInfoMapper;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public String login(LoginDto loginDto) {
        String username = loginDto.getUsername();
        String password = loginDto.getPassword();

        if (username.isBlank() || password.isBlank()) {
            throw new BusinessException("用户名或密码不能为空");
        }

        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(username, password);

        Authentication authenticate = authenticationManager.authenticate(authenticationToken);

        UserDetailsImpl loginUser = (UserDetailsImpl) authenticate.getPrincipal();

        UserInfo user = loginUser.getUser();

        if (user == null) {
            throw new BusinessException("账号或密码错误");
        }

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", user.getId());
        jsonObject.put("username", user.getUsername());

        return JwtUtils.createJWT(jsonObject.toJSONString());
    }

    @Override
    public Map register(RegisterDto registerDto) {
        String username = registerDto.getUsername();
        String password = registerDto.getPassword();
        String confirmPassword = registerDto.getConfirmPassword();

        if (username.isBlank() || password.isBlank() || confirmPassword.isBlank()) {
            throw new BusinessException("用户名或密码不能为空");
        }

        if (!password.equals(confirmPassword)) {
            throw new BusinessException("两次输入的密码不一致");
        }

        if (userInfoMapper.selectOne(new QueryWrapper<UserInfo>().eq("username", username)) != null) {
            throw new BusinessException("用户名已存在");
        }

        UserInfo user = UserInfo.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .build();

        userInfoMapper.insert(user);

        return Map.of("message", "success");
    }

}
