use std::sync::Arc;

use hmac::Hmac;
use sha2::Sha256;

#[derive(Clone)]
pub struct MailgunConfig {
    pub api_key: String,
    pub domain: String,
    pub base_url: String,
    pub from_email: String,
}

#[derive(Clone)]
pub struct AppState {
    pub db: DB,
    pub jwt_key: Hmac<Sha256>,
    pub mailgun: MailgunConfig,
}

pub type DB = Arc<sqlx::Pool<sqlx::Postgres>>;
