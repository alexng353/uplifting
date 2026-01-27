use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::settings::{UpdateSettingsBody, UserSettings};
use crate::*;

/// Get user settings
#[utoipa::path(
    get,
    path = "/me/settings",
    responses(
        (status = OK, body = UserSettings),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::USERS_TAG
)]
pub async fn get_settings(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<UserSettings>, AppError> {
    // Try to get existing settings, or return defaults
    let settings = query_as!(
        UserSettings,
        r#"
        SELECT user_id, display_unit, max_workout_duration_minutes, 
               default_rest_timer_seconds, default_privacy, share_gym_location,
               share_online_status, share_workout_status, share_workout_history
        FROM user_settings
        WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_optional(&*state.db)
    .await?;

    match settings {
        Some(s) => Ok(Json(s)),
        None => {
            // Create default settings
            let default = query_as!(
                UserSettings,
                r#"
                INSERT INTO user_settings (user_id)
                VALUES ($1)
                RETURNING user_id, display_unit, max_workout_duration_minutes,
                          default_rest_timer_seconds, default_privacy, share_gym_location,
                          share_online_status, share_workout_status, share_workout_history
                "#,
                user_id
            )
            .fetch_one(&*state.db)
            .await?;
            Ok(Json(default))
        }
    }
}

/// Update user settings
#[utoipa::path(
    put,
    path = "/me/settings",
    request_body = UpdateSettingsBody,
    responses(
        (status = OK, body = UserSettings),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::USERS_TAG
)]
pub async fn update_settings(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<UpdateSettingsBody>,
) -> Result<Json<UserSettings>, AppError> {
    // Upsert settings
    let settings = query_as!(
        UserSettings,
        r#"
        INSERT INTO user_settings (user_id, display_unit, max_workout_duration_minutes,
                                   default_rest_timer_seconds, default_privacy, share_gym_location,
                                   share_online_status, share_workout_status, share_workout_history)
        VALUES ($1, $2, COALESCE($3, 120), COALESCE($4, 90), COALESCE($5, 'friends'), COALESCE($6, true),
                COALESCE($7, true), COALESCE($8, true), COALESCE($9, true))
        ON CONFLICT (user_id) DO UPDATE
        SET 
            display_unit = COALESCE($2, user_settings.display_unit),
            max_workout_duration_minutes = COALESCE($3, user_settings.max_workout_duration_minutes),
            default_rest_timer_seconds = COALESCE($4, user_settings.default_rest_timer_seconds),
            default_privacy = COALESCE($5, user_settings.default_privacy),
            share_gym_location = COALESCE($6, user_settings.share_gym_location),
            share_online_status = COALESCE($7, user_settings.share_online_status),
            share_workout_status = COALESCE($8, user_settings.share_workout_status),
            share_workout_history = COALESCE($9, user_settings.share_workout_history)
        RETURNING user_id, display_unit, max_workout_duration_minutes,
                  default_rest_timer_seconds, default_privacy, share_gym_location,
                  share_online_status, share_workout_status, share_workout_history
        "#,
        user_id,
        body.display_unit,
        body.max_workout_duration_minutes,
        body.default_rest_timer_seconds,
        body.default_privacy,
        body.share_gym_location,
        body.share_online_status,
        body.share_workout_status,
        body.share_workout_history
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(settings))
}
