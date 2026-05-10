package dev.couponsphere.fraud.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record FraudScoreRequest(
    @NotBlank String userId,
    @NotBlank String couponCode,
    String deviceId,
    String ip,
    @PositiveOrZero int recentRedemptions,
    @PositiveOrZero int sharedDeviceUsers,
    @PositiveOrZero double cartValue
) {}

