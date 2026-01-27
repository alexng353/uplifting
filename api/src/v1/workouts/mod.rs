use crate::AppState;

pub(super) use super::*;

pub mod create;
pub mod delete;
pub mod get;
pub mod list;
pub mod summary;
pub mod update;

pub const WORKOUTS_TAG: &str = "workouts";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(list::list_workouts))
        .routes(routes!(create::create_workout))
        .routes(routes!(get::get_workout))
        .routes(routes!(update::update_workout))
        .routes(routes!(delete::delete_workout))
        .routes(routes!(summary::workout_summary))
        .with_state(state)
}
