use crate::AppState;

pub(super) use super::*;

pub mod activity;
pub mod feed;
pub mod list;
pub mod remove;
pub mod requests;
pub mod respond;
pub mod send;
pub mod workouts;

pub const FRIENDS_TAG: &str = "friends";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(list::list_friends))
        .routes(routes!(requests::list_requests))
        .routes(routes!(send::send_request))
        .routes(routes!(respond::respond_request))
        .routes(routes!(remove::remove_friend))
        .routes(routes!(feed::get_feed))
        .routes(routes!(activity::update_activity))
        .routes(routes!(workouts::get_friend_workouts))
        .with_state(state)
}
