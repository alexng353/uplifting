use chrono::{Duration, Utc};
use sqlx::query;

use crate::extractors::users::UserId;
use crate::util::mailgun::{generate_verification_code, send_email};
use crate::*;

/// Send email verification code
#[utoipa::path(
    post,
    path = "/send-verification",
    responses(
        (status = OK, description = "Verification code sent to email"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::AUTH_TAG
)]
pub async fn send_verification(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<&'static str, AppError> {
    // Get user email and check if already verified
    let user = query!(
        "SELECT email, email_verified FROM users WHERE id = $1",
        user_id
    )
    .fetch_one(&*state.db)
    .await?;

    if user.email_verified {
        return Ok("Email already verified");
    }

    // Delete any existing tokens for this user
    query!(
        "DELETE FROM email_verification_tokens WHERE user_id = $1",
        user_id
    )
    .execute(&*state.db)
    .await?;

    // Generate verification code
    let code = generate_verification_code();
    let expires_at = Utc::now().naive_utc() + Duration::minutes(30);

    // Store the token
    query!(
        "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
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
        "Verify Your Email Address",
        &format!("Your verification code is: {code}\n\nThis code will expire in 30 minutes."),
    )
    .await
    .context("Failed to send verification email")?;

    Ok("Verification code sent")
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct VerifyEmailBody {
    code: String,
}

/// Verify email with code
#[utoipa::path(
    post,
    path = "/verify-email",
    request_body = VerifyEmailBody,
    responses(
        (status = OK, description = "Email verified successfully"),
        (status = UNAUTHORIZED, description = "Invalid or expired code")
    ),
    tag = super::AUTH_TAG
)]
pub async fn verify_email(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<VerifyEmailBody>,
) -> Result<&'static str, AppError> {
    // Verify the token
    let token = query!(
        "SELECT id FROM email_verification_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()",
        user_id,
        body.code
    )
    .fetch_optional(&*state.db)
    .await?;

    if token.is_none() {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    // Mark email as verified
    query!(
        "UPDATE users SET email_verified = TRUE WHERE id = $1",
        user_id
    )
    .execute(&*state.db)
    .await?;

    // Delete used token
    query!(
        "DELETE FROM email_verification_tokens WHERE user_id = $1",
        user_id
    )
    .execute(&*state.db)
    .await?;

    Ok("Email verified successfully")
}
