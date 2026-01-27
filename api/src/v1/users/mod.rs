use crate::AppState;

pub(super) use super::*;

pub mod delete;
pub mod me;
pub mod search;
pub mod settings;
pub mod update;

pub const USERS_TAG: &str = "users";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(me::get_me))
        .routes(routes!(update::update_me))
        .routes(routes!(settings::get_settings))
        .routes(routes!(settings::update_settings))
        .routes(routes!(search::search_users))
        .routes(routes!(delete::delete_me))
        .with_state(state)
}
