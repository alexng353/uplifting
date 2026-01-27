use std::ops::Deref;

use chrono::NaiveDateTime;
use serde::{Deserialize, Deserializer, Serialize};
use utoipa::ToSchema;

/// A NaiveDateTime wrapper that deserializes from JavaScript ISO 8601 strings.
/// JavaScript's toISOString() produces "2026-01-16T07:57:30.097Z" but NaiveDateTime
/// expects no timezone suffix. This type handles both formats.
#[derive(Debug, Clone, Copy, Serialize, ToSchema)]
#[serde(transparent)]
pub struct JSDate(pub NaiveDateTime);

impl<'de> Deserialize<'de> for JSDate {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        // Strip trailing 'Z' if present
        let s = s.strip_suffix('Z').unwrap_or(&s);
        NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.f")
            .or_else(|_| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S"))
            .map(JSDate)
            .map_err(serde::de::Error::custom)
    }
}

impl Deref for JSDate {
    type Target = NaiveDateTime;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<JSDate> for NaiveDateTime {
    fn from(val: JSDate) -> Self {
        val.0
    }
}
