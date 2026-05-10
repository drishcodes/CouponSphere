package dev.couponsphere.fraud.model;

import java.util.List;

public record FraudScoreResponse(
    int riskScore,
    double fraudProbability,
    List<String> signals,
    String recommendation
) {}

