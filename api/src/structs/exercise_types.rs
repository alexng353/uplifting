use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize, ToSchema)]
#[sqlx(type_name = "exercise_type", rename_all = "snake_case")]
pub enum ExerciseType {
    Dumbbell,
    Barbell,
    Bodyweight,
    Machine,
    Kettlebell,
    ResistanceBand,
    Cable,
    MedicineBall,
    Plyometric,
    PlateLoadedMachine,
}

impl ExerciseType {
    pub fn all() -> Vec<Self> {
        vec![
            Self::Dumbbell,
            Self::Barbell,
            Self::Bodyweight,
            Self::Machine,
            Self::Kettlebell,
            Self::ResistanceBand,
            Self::Cable,
            Self::MedicineBall,
            Self::Plyometric,
            Self::PlateLoadedMachine,
        ]
    }
}

impl std::fmt::Display for ExerciseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExerciseType::Dumbbell => write!(f, "dumbbell"),
            ExerciseType::Barbell => write!(f, "barbell"),
            ExerciseType::Bodyweight => write!(f, "bodyweight"),
            ExerciseType::Machine => write!(f, "machine"),
            ExerciseType::Kettlebell => write!(f, "kettlebell"),
            ExerciseType::ResistanceBand => write!(f, "resistance_band"),
            ExerciseType::Cable => write!(f, "cable"),
            ExerciseType::MedicineBall => write!(f, "medicine_ball"),
            ExerciseType::Plyometric => write!(f, "plyometric"),
            ExerciseType::PlateLoadedMachine => write!(f, "plate_loaded_machine"),
        }
    }
}

impl std::str::FromStr for ExerciseType {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "dumbbell" => Ok(ExerciseType::Dumbbell),
            "barbell" => Ok(ExerciseType::Barbell),
            "bodyweight" => Ok(ExerciseType::Bodyweight),
            "machine" => Ok(ExerciseType::Machine),
            "kettlebell" => Ok(ExerciseType::Kettlebell),
            "resistance_band" => Ok(ExerciseType::ResistanceBand),
            "cable" => Ok(ExerciseType::Cable),
            "medicine_ball" => Ok(ExerciseType::MedicineBall),
            "plyometric" => Ok(ExerciseType::Plyometric),
            "plate_loaded_machine" => Ok(ExerciseType::PlateLoadedMachine),
            _ => Err(anyhow!("Invalid exercise type")),
        }
    }
}
