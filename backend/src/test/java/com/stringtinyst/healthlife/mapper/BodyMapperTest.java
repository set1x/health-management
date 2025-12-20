package com.stringtinyst.healthlife.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.stringtinyst.healthlife.pojo.Body;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.test.context.ActiveProfiles;

@MybatisTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = Replace.NONE)
class BodyMapperTest {

  @Autowired private BodyMapper bodyMapper;

  @Test
  void listShouldFilterByUserAndDateRange() {
    LocalDate start = LocalDate.parse("2024-05-01");
    LocalDate end = LocalDate.parse("2024-06-30");

    List<Body> rows = bodyMapper.list("user-1", start, end);

    assertThat(rows).hasSize(2);
    assertThat(rows)
        .extracting(Body::getRecordDate)
        .containsExactly(LocalDate.parse("2024-06-01"), LocalDate.parse("2024-05-01"));
  }

  @Test
  void insertUpdateAndDeleteLifecycleShouldWork() {
    Body body = new Body();
    body.setUserID("user-2");
    body.setHeightCM(new BigDecimal("163.00"));
    body.setWeightKG(new BigDecimal("58.20"));
    body.setRecordDate(LocalDate.parse("2024-07-01"));

    bodyMapper.insertBody(body);

    int bodyMetricId = bodyMapper.searchbodyID(body);
    Body persisted = bodyMapper.getByBodyID(bodyMetricId);
    assertThat(persisted).isNotNull();
    assertThat(persisted.getWeightKG()).isEqualTo(new BigDecimal("58.20"));

    persisted.setWeightKG(new BigDecimal("59.10"));
    bodyMapper.updateBody(persisted);
    Body updated = bodyMapper.getByBodyID(bodyMetricId);
    assertThat(updated.getWeightKG()).isEqualTo(new BigDecimal("59.10"));

    bodyMapper.removeBody(bodyMetricId);
    assertThat(bodyMapper.getByBodyID(bodyMetricId)).isNull();
  }
}
