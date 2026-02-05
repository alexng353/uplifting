use crate::AppState;

pub(super) use super::*;

pub mod crud;
pub mod profile_mappings;

pub const GYMS_TAG: &str = "gyms";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(crud::list_gyms))
        .routes(routes!(crud::create_gym))
        .routes(routes!(crud::update_gym))
        .routes(routes!(crud::delete_gym))
        .routes(routes!(profile_mappings::get_profile_mappings))
        .routes(routes!(profile_mappings::set_profile_mapping))
        .with_state(state)
}
