use crate::AppState;

pub(super) use super::*;

pub mod create;
pub mod favourite;
pub mod get;
pub mod list;
pub mod profiles;
pub mod types;

pub const EXERCISES_TAG: &str = "exercises";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(list::list_exercises))
        .routes(routes!(create::create))
        .routes(routes!(get::get_exercise))
        .routes(routes!(types::list_types))
        .routes(routes!(profiles::get_all_profiles))
        .routes(routes!(profiles::get_profiles))
        .routes(routes!(profiles::create_profile))
        .routes(routes!(favourite::list_favourites))
        .routes(routes!(favourite::add_favourite))
        .routes(routes!(favourite::remove_favourite))
        .with_state(state)
}
