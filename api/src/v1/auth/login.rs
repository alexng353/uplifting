use crate::*;
use argon2::{
    password_hash::{PasswordHash, PasswordVerifier},
    Argon2,
};
use jwt::SignWithKey;
use sqlx::query;
use util::auth::JWTClaims;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct LoginBody {
    username: String,
    password: String,
}

/// Login
#[utoipa::path(post, path = "/login", responses((status = OK, body = String)), tag = super::AUTH_TAG)]
pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginBody>,
) -> Result<String, AppError> {
    let user = query!(
        "SELECT id, real_name, username, email, password_hash, is_admin, created_at
        FROM users
        WHERE username = $1",
        body.username,
    )
    .fetch_one(&*state.db)
    .await?;

    let argon2 = Argon2::default();
    let hash = PasswordHash::new(&user.password_hash).expect("Password hashing failed");

    if argon2
        .verify_password(body.password.as_bytes(), &hash)
        .is_err()
    {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    let claims = JWTClaims::new(user.id, user.username, user.real_name, user.email);

    let token_str = claims
        .sign_with_key(&state.jwt_key)
        .context("Failed to sign JWT")?;

    Ok(token_str)
}
