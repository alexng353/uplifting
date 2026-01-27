use extractors::users::UserId;
use sqlx::query;

use crate::*;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreateMuscleBody {
    name: String,
    scientific_name: String,
    major_group: String,
    minor_group: String,
}

#[utoipa::path(post, path = "/create", responses((status = OK, body = String)), tag = super::MUSCLES_TAG)]
pub async fn create(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<CreateMuscleBody>,
) -> Result<String, AppError> {
    let is_admin = query!("SELECT is_admin FROM users WHERE id = $1", user_id)
        .fetch_one(&*state.db)
        .await?
        .is_admin;

    if !is_admin {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    let out = query!(
        "INSERT INTO muscles (name, scientific_name, major_group, minor_group) VALUES ($1, $2, $3, $4) RETURNING id",
        body.name,
        body.scientific_name,
        body.major_group,
        body.minor_group,
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(out.id.to_string())
}
