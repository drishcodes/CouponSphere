package dev.couponsphere.fraud.service;

import dev.couponsphere.fraud.model.FraudScoreRequest;
import dev.couponsphere.fraud.model.FraudScoreResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FraudScoringService {
  public FraudScoreResponse score(FraudScoreRequest request) {
    List<String> signals = new ArrayList<>();
    int score = 8;

    if (request.recentRedemptions() >= 4) {
      score += 24;
      signals.add("rapid_redemption_monitoring");
    }

    if (request.sharedDeviceUsers() >= 3) {
      score += 30;
      signals.add("multiple_account_device_fingerprint");
    }

    if (request.ip() != null && (request.ip().startsWith("10.") || request.ip().startsWith("203.0.113."))) {
      score += 16;
      signals.add("suspicious_ip_reputation");
    }

    if (request.cartValue() < 10) {
      score += 10;
      signals.add("low_cart_value_abuse_pattern");
    }

    if (request.couponCode().toLowerCase().contains("refer")) {
      score += 8;
      signals.add("referral_chain_review");
    }

    int bounded = Math.min(100, score);
    double probability = Math.round((bounded / 100.0) * 1000.0) / 1000.0;
    String recommendation = bounded >= 85 ? "block" : bounded >= 65 ? "otp_required" : bounded >= 40 ? "captcha_required" : "allow";

    return new FraudScoreResponse(bounded, probability, signals, recommendation);
  }
}

