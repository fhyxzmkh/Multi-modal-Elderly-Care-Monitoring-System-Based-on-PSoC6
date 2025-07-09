package com.embedded.utils;

import com.embedded.config.security.UserDetailsImpl;
import com.embedded.entity.po.UserInfo;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;


public class SecurityUtils {

    public static UserInfo getLoginUser() {

        UsernamePasswordAuthenticationToken authenticationToken =
                (UsernamePasswordAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        UserDetailsImpl loginUser = (UserDetailsImpl) authenticationToken.getPrincipal();

        return loginUser.getUser();
    }

}
