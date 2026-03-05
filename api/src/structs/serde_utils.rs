use std::ops::Deref;

use chrono::NaiveDateTime;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use utoipa::ToSchema;

/// A NaiveDateTime wrapper that round-trips JavaScript ISO 8601 strings.
/// All timestamps are treated as UTC by convention.
///
/// Deserialize: accepts "2026-01-16T07:57:30.097Z" or "2026-01-16T07:57:30.097"
/// Serialize: always appends 'Z' so the frontend knows the value is UTC.
#[derive(Debug, Clone, Copy, ToSchema)]
pub struct JSDate(pub NaiveDateTime);

impl Serialize for JSDate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = format!("{}Z", self.0.format("%Y-%m-%dT%H:%M:%S%.f"));
        serializer.serialize_str(&s)
    }
}

impl<'de> Deserialize<'de> for JSDate {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        // Strip trailing 'Z' if present — we store as NaiveDateTime (UTC by convention)
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
