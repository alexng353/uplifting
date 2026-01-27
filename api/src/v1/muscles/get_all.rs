// use extractors::users::UserId;
use sqlx::query_as;

use crate::*;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Muscle {
    id: String,
    name: String,
    scientific_name: Option<String>,
    major_group: Option<String>,
    minor_group: String,
}

#[utoipa::path(
    get,
    path = "/all",
    responses((status = OK, body = Vec<Muscle>)),
    tag = super::MUSCLES_TAG
)]
pub async fn get_all(State(state): State<AppState>) -> Result<Json<Vec<Muscle>>, AppError> {
    let muscles = query_as!(Muscle, "SELECT * FROM muscles")
        .fetch_all(&*state.db)
        .await?;

    Ok(Json(muscles))
}
