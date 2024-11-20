use rand::random;

pub fn send_notification(greeting_id: &str, name: &str) {
    if random::<f32>() < 0.5 {
        println!("Failed to send notification: {} - {}", greeting_id, name);
        panic!("Failed to send notification: {} - {}", greeting_id, name);
    }
    println!("Notification sent: {} - {}", greeting_id, name);
}

pub fn send_reminder(greeting_id: &str) {
    if random::<f32>() < 0.5 {
        println!("Failed to send reminder:  - {}", greeting_id);
        panic!("Failed to send reminder:  - {}", greeting_id);
    }
    println!("Reminder sent: {}", greeting_id);
}