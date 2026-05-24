package com.example.codeviz.pricing;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface PricingSignupRepository extends MongoRepository<PricingSignupEntity, String> {
}
