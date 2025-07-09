package com.embedded.controller;

import com.embedded.controller.common.ABaseController;
import com.embedded.entity.po.ImageInfo;
import com.embedded.entity.vo.ResponseVO;
import com.embedded.service.ImageInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/image")
public class ImageController extends ABaseController {

    @Autowired
    private ImageInfoService imageInfoService;

    @GetMapping("/list")
    public ResponseVO list() {
        return getSuccessResponseVO(imageInfoService.list());
    }

    @PostMapping("/add")
    public ResponseVO add(@RequestBody ImageInfo imageInfo) {
        imageInfoService.addImage(imageInfo);
        return getSuccessResponseVO(null);
    }

    @PostMapping("/delete")
    public ResponseVO delete(@RequestParam Integer id) {
        imageInfoService.deleteImage(id);
        return getSuccessResponseVO(null);
    }

}
