package com.stringtinyst.healthlife.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.github.pagehelper.Page;
import com.stringtinyst.healthlife.mapper.BodyMapper;
import com.stringtinyst.healthlife.pojo.Body;
import com.stringtinyst.healthlife.pojo.PageBean;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BodyServiceImplTest {

  @Mock private BodyMapper bodyMapper;

  @InjectMocks private BodyServiceImpl bodyService;

  @Test
  void pageShouldWrapMapperResultIntoPageBean() {
    Page<Body> page = new Page<>();
    Body row = new Body();
    row.setBodyMetricID(1);
    row.setUserID("user-1");
    row.setHeightCM(new BigDecimal("175.0"));
    row.setWeightKG(new BigDecimal("70.0"));
    row.setRecordDate(LocalDate.parse("2024-06-01"));
    page.add(row);
    page.setTotal(1);

    when(bodyMapper.list(eq("user-1"), isNull(), isNull())).thenReturn(page);

    PageBean pageBean = bodyService.page(1, 10, "user-1", null, null);

    assertThat(pageBean.getTotal()).isEqualTo(1);
    assertThat(pageBean.getRows()).hasSize(1);
    verify(bodyMapper).list(eq("user-1"), isNull(), isNull());
  }

  @Test
  void addBodyShouldDelegateToMapper() {
    Body body = new Body();
    body.setUserID("user-1");
    body.setHeightCM(new BigDecimal("175"));
    body.setWeightKG(new BigDecimal("70"));
    body.setRecordDate(LocalDate.now());

    bodyService.addBody(body);

    verify(bodyMapper).insertBody(body);
  }

  @Test
  void deleteBodyShouldDelegateToMapper() {
    bodyService.deleteBody(42);

    verify(bodyMapper).removeBody(42);
  }
}
