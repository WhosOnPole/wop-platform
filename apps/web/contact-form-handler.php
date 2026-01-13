<?php
session_start(); // Needed for cooldown tracking

// Set email recipient
$to = "hello@whosonpole.org";

// Spam protection: Honeypot field
if (!empty($_POST['website'])) { // bots will fill this hidden field
    http_response_code(400);
    echo "Spam detected.";
    exit;
}

// Cooldown: 30 seconds between submissions per IP
$cooldown = 30; // seconds
$ip = $_SERVER['REMOTE_ADDR'];

if (isset($_SESSION['last_submission_time']) && (time() - $_SESSION['last_submission_time']) < $cooldown) {
    http_response_code(429); // Too many requests
    echo "Please wait before submitting again.";
    exit;
}

// Sanitize and validate input
$name = filter_var(trim($_POST['name'] ?? ''), FILTER_SANITIZE_STRING);
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$message = filter_var(trim($_POST['message'] ?? ''), FILTER_SANITIZE_STRING);

// Extra protection: Prevent header injections
if (preg_match("/[\r\n]/", $name) || preg_match("/[\r\n]/", $email)) {
    http_response_code(400);
    echo "Invalid input.";
    exit;
}

// Validate fields
if (!$email || empty($name) || empty($message)) {
    http_response_code(400);
    echo "Please complete the form correctly.";
    exit;
}

// Build email content
$subject = "New signup from Who's on Pole website";
$body = "You’ve received a new email signup:\n\n";
$body .= "Email: $email\n\n";

// Set email headers
$headers = "From: Who's on Pole <no-reply@whosonpole.org>\r\n";
$headers .= "Reply-To: $email\r\n";

// Send the email
$success = mail($to, $subject, $body, $headers);

// Update cooldown timer if success
if ($success) {
    $_SESSION['last_submission_time'] = time();
    header("Location: /"); // <<< Redirects user back to your homepage
    exit;
} else {
    http_response_code(500);
    echo "Oops! Something went wrong and we couldn’t send your message.";
}
?>
