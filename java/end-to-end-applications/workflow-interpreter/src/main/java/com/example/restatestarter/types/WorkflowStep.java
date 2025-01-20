package com.example.restatestarter.types;

import java.util.Map;

public record WorkflowStep(
        String imgInputPath,
        String imgOutputPath,
        String action,
        Map<String, Object> parameters
) {}
