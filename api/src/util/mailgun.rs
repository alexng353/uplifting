use crate::state::MailgunConfig;
use anyhow::Context;

pub async fn send_email(
    config: &MailgunConfig,
    to: &str,
    subject: &str,
    text: &str,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let url = format!("{}/v3/{}/messages", config.base_url, config.domain);

    let response = client
        .post(&url)
        .basic_auth("api", Some(&config.api_key))
        .form(&[
            ("from", config.from_email.as_str()),
            ("to", to),
            ("subject", subject),
            ("text", text),
        ])
        .send()
        .await
        .context("Failed to send email request")?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        anyhow::bail!("Mailgun request failed with status {}: {}", status, body);
    }

    Ok(())
}

pub fn generate_verification_code() -> String {
    use rand::Rng;
    let code: u32 = rand::thread_rng().gen_range(100000..999999);
    code.to_string()
}
