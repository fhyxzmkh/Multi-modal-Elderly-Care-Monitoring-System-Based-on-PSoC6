package com.embedded.service;

import com.alibaba.fastjson.JSONObject;
import com.embedded.entity.po.PhysiologicalInfo;
import org.springframework.http.ResponseEntity;

public interface PhysiologicalService {

    JSONObject getMockData();

    JSONObject getPhysiologicalDataList(Integer page, Integer pageSize);

    void addPhysiologicalData(PhysiologicalInfo physiologicalInfo);

    void deletePhysiologicalData(Integer id);
}
