export async function recommendCoupon({ lifetimeValue, cartAbandonmentRate, fraudScore }) {
  const baseDiscount = lifetimeValue > 500 ? 18 : 12;
  const urgencyBoost = cartAbandonmentRate > 0.6 ? 8 : 3;
  const fraudPenalty = fraudScore > 50 ? 7 : 0;
  const recommendedDiscount = Math.max(5, Math.min(45, baseDiscount + urgencyBoost - fraudPenalty));

  return {
    recommendedDiscount,
    predictedConversion: Math.min(92, 38 + recommendedDiscount * 1.3),
    segment: lifetimeValue > 500 ? 'vip_retention' : 'growth_conversion',
    explanation: 'Provider-neutral AI adapter. Wire OpenAI or Gemini here for production model calls.'
  };
}

