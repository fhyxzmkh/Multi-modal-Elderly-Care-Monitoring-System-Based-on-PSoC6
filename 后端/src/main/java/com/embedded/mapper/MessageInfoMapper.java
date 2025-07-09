package com.embedded.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.embedded.entity.po.MessageInfo;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageInfoMapper extends BaseMapper<MessageInfo> {
}
