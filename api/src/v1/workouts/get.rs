use std::collections::BTreeMap;

use axum::extract::Path;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::sets::UserSet;
use crate::structs::workouts::{Workout, WorkoutExerciseGroup, WorkoutWithSets};
use crate::*;

/// Group a flat list of sets into exercise groups, inferring is_unilateral
/// from whether any set in the group has a side value.
/// Preserves insertion order using BTreeMap keyed by first-seen index.
pub fn group_sets_by_exercise(sets: Vec<UserSet>) -> Vec<WorkoutExerciseGroup> {
    let mut groups: BTreeMap<usize, WorkoutExerciseGroup> = BTreeMap::new();
    let mut key_to_index: std::collections::HashMap<(Uuid, Option<Uuid>), usize> =
        std::collections::HashMap::new();
    let mut next_index: usize = 0;

    for set in sets {
        let key = (set.exercise_id, set.profile_id);
        let idx = *key_to_index.entry(key).or_insert_with(|| {
            let i = next_index;
            next_index += 1;
            i
        });

        let group = groups.entry(idx).or_insert_with(|| WorkoutExerciseGroup {
            exercise_id: key.0,
            profile_id: key.1,
            is_unilateral: false,
            sets: Vec::new(),
        });

        if set.side.is_some() {
            group.is_unilateral = true;
        }

        group.sets.push(set);
    }

    groups.into_values().collect()
}

/// Get a workout with all its sets grouped by exercise
#[utoipa::path(
    get,
    path = "/{workout_id}",
    params(
        ("workout_id" = Uuid, Path, description = "Workout ID")
    ),
    responses(
        (status = OK, body = WorkoutWithSets),
        (status = NOT_FOUND, description = "Workout not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn get_workout(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(workout_id): Path<Uuid>,
) -> Result<Json<WorkoutWithSets>, AppError> {
    // Check ownership
    let owner_id = query_scalar!("SELECT user_id FROM workouts WHERE id = $1", workout_id)
        .fetch_optional(&*state.db)
        .await?;

    match owner_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    let workout = query_as!(
        Workout,
        r#"
        SELECT id, user_id, name, start_time, end_time, privacy, gym_location, kind
        FROM workouts
        WHERE id = $1
        "#,
        workout_id
    )
    .fetch_one(&*state.db)
    .await?;

    let sets = query_as!(
        UserSet,
        r#"
        SELECT id, user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, created_at, side
        FROM user_sets
        WHERE workout_id = $1
        ORDER BY created_at ASC
        "#,
        workout_id
    )
    .fetch_all(&*state.db)
    .await?;

    let exercises = group_sets_by_exercise(sets);

    Ok(Json(WorkoutWithSets { workout, exercises }))
}
