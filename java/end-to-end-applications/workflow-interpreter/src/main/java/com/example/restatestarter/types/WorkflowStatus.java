package com.example.restatestarter.types;

import java.util.List;
import java.util.Objects;

public final class WorkflowStatus {
    private String status;
    private String imgName;
    private List<String> output;

    public WorkflowStatus(
            String status,
            String imgName,
            List<String> output
    ) {
        this.status = status;
        this.imgName = imgName;
        this.output = output;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void addToOutput(String output) {
        this.output.add(output);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) return true;
        if (obj == null || obj.getClass() != this.getClass()) return false;
        var that = (WorkflowStatus) obj;
        return Objects.equals(this.status, that.status) &&
                Objects.equals(this.imgName, that.imgName) &&
                Objects.equals(this.output, that.output);
    }

    @Override
    public int hashCode() {
        return Objects.hash(status, imgName, output);
    }

    @Override
    public String toString() {
        return "WorkflowStatus[" +
                "status=" + status + ", " +
                "imgName=" + imgName + ", " +
                "output=" + output + ']';
    }
}
