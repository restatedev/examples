package my.example.utils;

import my.example.types.SocialMediaPost;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.UUID;

public class Stubs {
    private static final Logger logger = LogManager.getLogger(Stubs.class);

    public static String createPost(String userId, SocialMediaPost post) {
        String postId = UUID.randomUUID().toString();
        logger.info("Creating post {} for user {}", postId, userId);
        return postId;
    }

    public static String getPostStatus(String postId) {
        if (Math.random() < 0.8) {
            logger.info("Content moderation for post {} is still pending... Will check again in 5 seconds", postId);
            return "PENDING";
        } else {
            logger.info("Content moderation for post {} is done", postId);
            return "DONE";
        }
    }

    public static void updateUserFeed(String userId, String postId) {
        logger.info("Updating user feed for user {} with post {}", userId, postId);
    }
}
