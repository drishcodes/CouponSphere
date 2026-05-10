package dev.couponsphere.fraud;

import dev.couponsphere.fraud.model.FraudScoreRequest;
import dev.couponsphere.fraud.service.FraudScoringService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FraudScoringServiceTest {
  @Test
  void scoresHighRiskDeviceReuse() {
    FraudScoringService service = new FraudScoringService();
    var response = service.score(new FraudScoreRequest("u1", "REFER20", "d1", "203.0.113.42", 5, 4, 8));
    assertThat(response.riskScore()).isGreaterThanOrEqualTo(85);
    assertThat(response.recommendation()).isEqualTo("block");
  }
}

