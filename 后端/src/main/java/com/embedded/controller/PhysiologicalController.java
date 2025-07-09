package com.embedded.controller;

import com.embedded.controller.common.ABaseController;
import com.embedded.entity.po.PhysiologicalInfo;
import com.embedded.entity.vo.ResponseVO;
import com.embedded.service.PhysiologicalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/physiological")
public class PhysiologicalController extends ABaseController {

    @Autowired
    private PhysiologicalService physiologicalService;

    @GetMapping("/mock")
    public ResponseVO getMockData() {
        return getSuccessResponseVO(physiologicalService.getMockData());
    }

    @GetMapping("/get/list")
    public ResponseVO getPhysiologicalDataList(@RequestParam Integer page, @RequestParam Integer pageSize) {
        return getSuccessResponseVO(physiologicalService.getPhysiologicalDataList(page, pageSize));
    }

    @PostMapping("/add")
    public ResponseVO addPhysiologicalData(@RequestBody PhysiologicalInfo physiologicalInfo) {
        physiologicalService.addPhysiologicalData(physiologicalInfo);
        return getSuccessResponseVO(null);
    }

    @PostMapping("/delete")
    public ResponseVO deletePhysiologicalData(@RequestParam Integer id) {
        physiologicalService.deletePhysiologicalData(id);
        return getSuccessResponseVO(null);
    }

}
