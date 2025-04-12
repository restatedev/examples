package com.example.restatestarter.types;

import java.util.List;
import java.util.stream.Stream;

public record WorkflowStatus(
        String status,
        String imgName,
        List<String> output
) {

    public WorkflowStatus withStatus(String newStatus) {
        return new WorkflowStatus(newStatus, this.imgName, this.output);
    }

    public WorkflowStatus withNewOutput(String output) {
        return new WorkflowStatus(this.status, this.imgName, Stream.concat(this.output().stream(), Stream.of(output)).toList());
    }

}
