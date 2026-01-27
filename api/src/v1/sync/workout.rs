use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::sets::{PreviousSet, PreviousSetData};
use crate::structs::sync::{SyncWorkoutRequest, SyncWorkoutResponse};
use crate::*;

/// Sync a completed workout from offline storage
#[utoipa::path(
    post,
    path = "/workout",
    request_body = SyncWorkoutRequest,
    responses(
        (status = OK, body = SyncWorkoutResponse),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::SYNC_TAG
)]
pub async fn sync_workout(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<SyncWorkoutRequest>,
) -> Result<Json<SyncWorkoutResponse>, AppError> {
    let mut tx = state.db.begin().await?;
    let kind: String = body.kind.clone().into();

    // Create the workout
    let workout = sqlx::query!(
        r#"
        INSERT INTO workouts (user_id, name, start_time, end_time, privacy, gym_location, kind)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
        user_id,
        body.name,
        *body.start_time,
        *body.end_time,
        body.privacy,
        body.gym_location,
        kind
    )
    .fetch_one(&mut *tx)
    .await?;

    // Insert all sets
    for exercise in &body.exercises {
        for set in &exercise.sets {
            sqlx::query!(
                r#"
                INSERT INTO user_sets (user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, created_at, side)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                "#,
                user_id,
                exercise.exercise_id,
                workout.id,
                exercise.profile_id,
                set.reps,
                set.weight,
                set.weight_unit,
                *set.created_at,
                set.side
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

    // Build previous sets data for each exercise+profile combo used
    let mut previous_sets = Vec::new();
    for exercise in &body.exercises {
        let sets = query_as!(
            PreviousSet,
            r#"
            SELECT reps, weight, weight_unit, side
            FROM user_sets
            WHERE user_id = $1 AND exercise_id = $2 AND workout_id = $3
            ORDER BY created_at ASC
            "#,
            user_id,
            exercise.exercise_id,
            workout.id
        )
        .fetch_all(&*state.db)
        .await?;

        previous_sets.push(PreviousSetData {
            exercise_id: exercise.exercise_id,
            profile_id: exercise.profile_id,
            sets,
        });
    }

    Ok(Json(SyncWorkoutResponse {
        workout_id: workout.id,
        previous_sets,
    }))
}
