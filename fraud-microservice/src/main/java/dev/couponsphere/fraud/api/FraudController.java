package dev.couponsphere.fraud.api;

import dev.couponsphere.fraud.model.FraudScoreRequest;
import dev.couponsphere.fraud.model.FraudScoreResponse;
import dev.couponsphere.fraud.service.FraudScoringService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fraud")
public class FraudController {
  private final FraudScoringService scoringService;

  public FraudController(FraudScoringService scoringService) {
    this.scoringService = scoringService;
  }

  @PostMapping("/score")
  public FraudScoreResponse score(@Valid @RequestBody FraudScoreRequest request) {
    return scoringService.score(request);
  }
}

