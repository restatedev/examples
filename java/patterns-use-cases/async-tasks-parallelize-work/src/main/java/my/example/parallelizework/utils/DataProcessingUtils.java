package my.example.parallelizework.utils;

import my.example.parallelizework.FanOutWorker;

import java.util.List;

public class DataProcessingUtils {

    public static FanOutWorker.Result aggregate(FanOutWorker.SubTaskResult[] results) {
        return new FanOutWorker.Result();
    }

    public static List<FanOutWorker.SubTask> split(FanOutWorker.Task task) {
        return null;
    }
}
