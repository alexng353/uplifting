use anyhow::Context;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();

    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: test-email <email-address>");
        std::process::exit(1);
    }

    let to_email = &args[1];

    let api_key = std::env::var("MAILGUN_API_KEY").context("MAILGUN_API_KEY not set")?;
    let domain = std::env::var("MAILGUN_DOMAIN").context("MAILGUN_DOMAIN not set")?;
    let base_url = std::env::var("MAILGUN_BASE_URL").context("MAILGUN_BASE_URL not set")?;
    let from_email = std::env::var("MAILGUN_FROM_EMAIL").context("MAILGUN_FROM_EMAIL not set")?;

    println!("Sending test email to: {to_email}");
    println!("From: {from_email}");
    println!("Domain: {domain}");

    let client = reqwest::Client::new();
    let url = format!("{base_url}/v3/{domain}/messages");

    let response = client
        .post(&url)
        .basic_auth("api", Some(&api_key))
        .form(&[
            ("from", from_email.as_str()),
            ("to", to_email),
            ("subject", "Test Email from Uplifting API"),
            (
                "text",
                "This is a test email to verify Mailgun configuration is working correctly.",
            ),
        ])
        .send()
        .await
        .context("Failed to send email request")?;

    let status = response.status();
    let body = response.text().await.unwrap_or_default();

    if status.is_success() {
        println!("✓ Email sent successfully!");
        println!("Response: {body}");
    } else {
        eprintln!("✗ Failed to send email");
        eprintln!("Status: {status}");
        eprintln!("Response: {body}");
        std::process::exit(1);
    }

    Ok(())
}
