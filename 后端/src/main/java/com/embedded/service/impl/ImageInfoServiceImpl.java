package com.embedded.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.embedded.entity.po.ImageInfo;
import com.embedded.mapper.ImageInfoMapper;
import com.embedded.service.ImageInfoService;
import com.embedded.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ImageInfoServiceImpl implements ImageInfoService {

    @Autowired
    private ImageInfoMapper imageInfoMapper;

    @Override
    public JSONObject list() {

        JSONObject jsonObject = new JSONObject();

        jsonObject.put("raw", imageInfoMapper.selectList(
                new QueryWrapper<ImageInfo>().orderByDesc("create_time"))
        );
        jsonObject.put("count", imageInfoMapper.selectCount(null));

        return jsonObject;
    }

    @Override
    public void deleteImage(Integer id) {
        if (id == null || imageInfoMapper.selectById(id) == null) {
            throw new IllegalArgumentException("Image ID cannot be null or does not exist.");
        }
        imageInfoMapper.deleteById(id);
    }

    @Override
    public void addImage(ImageInfo imageInfo) {
        imageInfo.setUserId(SecurityUtils.getLoginUser().getId());
        imageInfoMapper.insert(imageInfo);
    }
}
