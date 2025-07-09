package com.embedded.utils;

import org.apache.commons.lang3.RandomStringUtils;

public class RandomTools {

    public static final String getRandomString(Integer length) {
        return RandomStringUtils.random(length, true, true);
    }

    public static final String getRandomNumberString(Integer length) {
        return RandomStringUtils.random(length, false, true);
    }

}
