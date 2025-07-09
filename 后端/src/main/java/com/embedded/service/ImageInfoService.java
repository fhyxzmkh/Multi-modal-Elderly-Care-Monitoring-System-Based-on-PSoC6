package com.embedded.service;

import com.alibaba.fastjson.JSONObject;
import com.embedded.entity.po.ImageInfo;

public interface ImageInfoService {
    void addImage(ImageInfo imageInfo);

    JSONObject list();

    void deleteImage(Integer id);
}
