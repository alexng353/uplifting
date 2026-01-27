use chrono::{Duration, Utc};
use sqlx::query;

use crate::extractors::users::UserId;
use crate::util::mailgun::{generate_verification_code, send_email};
use crate::*;

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};

/// Request a password change verification code
#[utoipa::path(
    post,
    path = "/request-password-change",
    responses(
        (status = OK, description = "Verification code sent to email"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::AUTH_TAG
)]
pub async fn request_password_change(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<&'static str, AppError> {
    // Get user email
    let user = query!(
        "SELECT email, email_verified FROM users WHERE id = $1",
        user_id
    )
    .fetch_one(&*state.db)
    .await?;

    if !user.email_verified {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    // Delete any existing tokens for this user
    query!(
        "DELETE FROM password_reset_tokens WHERE user_id = $1",
        user_id
    )
    .execute(&*state.db)
    .await?;

    // Generate verification code
    let code = generate_verification_code();
    let expires_at = Utc::now().naive_utc() + Duration::minutes(15);

    // Store the token
    query!(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        user_id,
        code,
        expires_at
    )
    .execute(&*state.db)
    .await?;

    // Send email
    send_email(
        &state.mailgun,
        &user.email,
        "Password Change Verification Code",
        &format!("Your verification code is: {code}\n\nThis code will expire in 15 minutes."),
    )
    .await
    .context("Failed to send verification email")?;

    Ok("Verification code sent")
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ChangePasswordBody {
    code: String,
    new_password: String,
}

/// Change password with verification code
#[utoipa::path(
    post,
    path = "/change-password",
    request_body = ChangePasswordBody,
    responses(
        (status = OK, description = "Password changed successfully"),
        (status = UNAUTHORIZED, description = "Invalid or expired code")
    ),
    tag = super::AUTH_TAG
)]
pub async fn change_password(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<ChangePasswordBody>,
) -> Result<&'static str, AppError> {
    // Verify the token
    let token = query!(
        "SELECT id FROM password_reset_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()",
        user_id,
        body.code
    )
    .fetch_optional(&*state.db)
    .await?;

    if token.is_none() {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    // Hash the new password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(body.new_password.as_bytes(), &salt)
        .expect("Password hashing failed")
        .to_string();

    // Update password
    query!(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        hash,
        user_id
    )
    .execute(&*state.db)
    .await?;

    // Delete used token
    query!(
        "DELETE FROM password_reset_tokens WHERE user_id = $1",
        user_id
    )
    .execute(&*state.db)
    .await?;

    Ok("Password changed successfully")
}
