use chrono::Utc;
use uuid::Uuid;

use crate::*;

#[derive(Serialize, Deserialize)]
pub struct JWTClaims {
    pub sub: Uuid,
    pub iat: i64,
    pub exp: i64,

    pub username: String,
    pub real_name: String,
    pub email: String,
}

impl JWTClaims {
    pub fn new(sub: Uuid, username: String, real_name: String, email: String) -> Self {
        let iat = Utc::now().timestamp();
        let exp = iat + 60 * 60 * 24 * 7;
        Self::new_with_exp(sub, username, real_name, email, exp)
    }

    /// Create a new JWT Claims with a custom expiration time. Expiration time is added to current time.
    pub fn new_with_exp(
        sub: Uuid,
        username: String,
        real_name: String,
        email: String,
        exp: i64,
    ) -> Self {
        let iat = Utc::now().timestamp();
        Self {
            sub,
            iat,
            exp: iat + exp,
            username,
            real_name,
            email,
        }
    }
}
