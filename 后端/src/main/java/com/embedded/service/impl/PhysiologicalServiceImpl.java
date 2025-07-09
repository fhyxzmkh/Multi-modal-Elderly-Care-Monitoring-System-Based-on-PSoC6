package com.embedded.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.embedded.entity.po.PhysiologicalInfo;
import com.embedded.mapper.PhysiologicalInfoMapper;
import com.embedded.service.PhysiologicalService;
import com.embedded.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class PhysiologicalServiceImpl implements PhysiologicalService {

    private static final Random random = new Random();

    @Autowired
    private PhysiologicalInfoMapper physiologicalInfoMapper;

    @Override
    public JSONObject getMockData() {
        JSONObject result = new JSONObject();

        result.put("heart_rate",  65 + (85 - 65) * random.nextDouble());
        result.put("target_distance",  0.5 + (3.5 - 0.5) * random.nextDouble());
        result.put("timestamp", System.currentTimeMillis() / 1000.0);
        result.put("status", "ok");

        return result;
    }

    @Override
    public JSONObject getPhysiologicalDataList(Integer page, Integer pageSize) {
        IPage<PhysiologicalInfo> physiologicalInfoIPage = new Page<>(page, pageSize);
        QueryWrapper<PhysiologicalInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", SecurityUtils.getLoginUser().getId());
        queryWrapper.orderByDesc("id");

        JSONObject result = new JSONObject();
        result.put("total", physiologicalInfoMapper.selectCount(null));
        result.put("rows", physiologicalInfoMapper.selectPage(physiologicalInfoIPage, queryWrapper).getRecords());

        return result;
    }

    @Override
    public void addPhysiologicalData(PhysiologicalInfo physiologicalInfo) {
        physiologicalInfo.setUserId(SecurityUtils.getLoginUser().getId());
        physiologicalInfoMapper.insert(physiologicalInfo);
    }

    @Override
    public void deletePhysiologicalData(Integer id) {
        physiologicalInfoMapper.deleteById(id);
    }
}
