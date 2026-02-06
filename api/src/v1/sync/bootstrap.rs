use std::collections::HashMap;

use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::gyms::Gym;
use crate::structs::profiles::ExerciseProfile;
use crate::structs::sync::{BootstrapGymProfileMapping, BootstrapPreviousSet, BootstrapResponse};
use crate::*;

/// Get all user data for initial app bootstrap
///
/// Returns gyms, profiles, gym profile mappings, and previous sets
/// for populating local storage on app startup.
#[utoipa::path(
    get,
    path = "/bootstrap",
    responses(
        (status = OK, body = BootstrapResponse),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::SYNC_TAG
)]
pub async fn get_bootstrap(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<BootstrapResponse>, AppError> {
    // Fetch gyms
    let gyms = query_as!(
        Gym,
        r#"
        SELECT id, user_id, name, latitude, longitude, created_at
        FROM user_gyms
        WHERE user_id = $1
        ORDER BY created_at ASC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    // Fetch profiles
    let profiles = query_as!(
        ExerciseProfile,
        r#"
        SELECT id, user_id, exercise_id, name, created_at
        FROM exercise_profiles
        WHERE user_id = $1
        ORDER BY exercise_id, name ASC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    // Fetch gym profile mappings
    let gym_profile_mappings = query_as!(
        BootstrapGymProfileMapping,
        r#"
        SELECT gym_id, exercise_id, profile_id
        FROM user_gym_profile_mappings
        WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    // Fetch previous sets (most recent workout's sets for each exercise+profile combo)
    // This query gets the last set of each exercise+profile from the user's most recent workouts
    let previous_sets_rows = query_as!(
        PreviousSetRow,
        r#"
        WITH ranked_sets AS (
            SELECT
                s.exercise_id,
                s.profile_id,
                s.reps,
                s.weight,
                s.weight_unit,
                s.side,
                s.created_at,
                w.end_time,
                ROW_NUMBER() OVER (
                    PARTITION BY s.exercise_id, COALESCE(s.profile_id, '00000000-0000-0000-0000-000000000000')
                    ORDER BY w.end_time DESC, s.created_at ASC
                ) as rn,
                DENSE_RANK() OVER (
                    PARTITION BY s.exercise_id, COALESCE(s.profile_id, '00000000-0000-0000-0000-000000000000')
                    ORDER BY w.end_time DESC
                ) as workout_rank
            FROM user_sets s
            JOIN workouts w ON s.workout_id = w.id
            WHERE s.user_id = $1
        )
        SELECT
            exercise_id,
            profile_id,
            reps,
            weight,
            weight_unit,
            side
        FROM ranked_sets
        WHERE workout_rank = 1
        ORDER BY exercise_id, profile_id, created_at ASC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    // Group previous sets by exercise_id + profile_id
    let mut previous_sets: HashMap<String, Vec<BootstrapPreviousSet>> = HashMap::new();
    for row in previous_sets_rows {
        let key = format!(
            "{}_{}",
            row.exercise_id,
            row.profile_id
                .map(|id| id.to_string())
                .unwrap_or_else(|| "default".to_string())
        );
        previous_sets.entry(key).or_default().push(BootstrapPreviousSet {
            reps: row.reps,
            weight: row.weight,
            weight_unit: row.weight_unit,
            side: row.side,
        });
    }

    Ok(Json(BootstrapResponse {
        gyms,
        profiles,
        gym_profile_mappings,
        previous_sets,
    }))
}

#[derive(Debug)]
struct PreviousSetRow {
    exercise_id: uuid::Uuid,
    profile_id: Option<uuid::Uuid>,
    reps: i32,
    weight: rust_decimal::Decimal,
    weight_unit: String,
    side: Option<String>,
}
