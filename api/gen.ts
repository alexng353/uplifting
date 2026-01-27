// Define the structure of your data
interface Muscle {
  colloquial_name: string;
  scientific_name: string;
}

interface MuscleGroup {
  major_group: string;
  group_name: string;
  muscles: Muscle[];
}

// Your JSON data
const data: MuscleGroup[] = [
  {
    major_group: "Upper Body",
    group_name: "Chest",
    muscles: [
      { colloquial_name: "Upper Pecs", scientific_name: "Clavicular Pectoralis Major" },
      { colloquial_name: "Pecs", scientific_name: "Sternal Pectoralis Major" },
    ]
  },
  {
    major_group: "Upper Body",
    group_name: "Back",
    muscles: [
      { colloquial_name: "Lats", scientific_name: "Latissimus dorsi" },
      { colloquial_name: "Traps", scientific_name: "Trapezius" },
      { colloquial_name: "Rhomboids", scientific_name: "Rhomboideus major" },
      { colloquial_name: "Spinal Erectors", scientific_name: "Erector spinae" },
      { colloquial_name: "Teres Major", scientific_name: "Teres major" }
    ]
  },
  {
    major_group: "Upper Body",
    group_name: "Shoulders",
    muscles: [
      { colloquial_name: "Front Delts", scientific_name: "Anterior deltoid" },
      { colloquial_name: "Rear Delts", scientific_name: "Posterior deltoid" },
      { colloquial_name: "Side Delts", scientific_name: "Lateral deltoid" },
      { colloquial_name: "Rotator Cuff", scientific_name: "Rotator cuff" }
    ]
  },
  {
    major_group: "Upper Body",
    group_name: "Arms",
    muscles: [
      { colloquial_name: "Biceps", scientific_name: "Biceps brachii" },
      { colloquial_name: "Brachialis", scientific_name: "Brachialis" },
      // TODO: add all 3 tricep heads, since you can easily bias them
      { colloquial_name: "Triceps", scientific_name: "Triceps brachii" },
      { colloquial_name: "Brachioradialis", scientific_name: "Brachioradialis" },
      { colloquial_name: "Forearm Flexors/Extensors", scientific_name: "Flexor and extensor muscles of the forearm" }
    ]
  },
  {
    major_group: "Core",
    group_name: "Abdominals",
    muscles: [
      // TODO: add upper and lower core muscles
      { colloquial_name: "Abs", scientific_name: "Rectus abdominis" },
      { colloquial_name: "Transverse Abs", scientific_name: "Transversus abdominis" },
      { colloquial_name: "External Obliques", scientific_name: "Obliquus externus abdominis" },
      { colloquial_name: "Internal Obliques", scientific_name: "Obliquus internus abdominis" }
    ]
  },
  {
    major_group: "Core",
    group_name: "Lower Back",
    muscles: [
      { colloquial_name: "QL", scientific_name: "Quadratus lumborum" },
    ]
  },
  {
    major_group: "Lower Body",
    group_name: "Legs",
    muscles: [
      { colloquial_name: "Quads", scientific_name: "Quadriceps femoris" },
      { colloquial_name: "Hamstrings", scientific_name: "Hamstring muscles" },
      { colloquial_name: "Glutes", scientific_name: "Gluteus maximus" },
      { colloquial_name: "Glute Med", scientific_name: "Gluteus medius" },
      { colloquial_name: "Glute Min", scientific_name: "Gluteus minimus" },
      { colloquial_name: "Adductors", scientific_name: "Adductor muscles" },
      { colloquial_name: "Abductors", scientific_name: "Abductor muscles" }
    ]
  },
  {
    major_group: "Lower Body",
    group_name: "Calves",
    muscles: [
      { colloquial_name: "Gastrocs", scientific_name: "Gastrocnemius" },
      { colloquial_name: "Soleus", scientific_name: "Soleus" }
    ]
  }
];

// Generate SQL INSERT statements
function generateSQL(data: MuscleGroup[]): string {
  let sql = "";

  data.forEach((group) => {
    group.muscles.forEach((muscle) => {
      sql += `INSERT INTO muscles (major_group, minor_group, name, scientific_name) VALUES ('${group.major_group}', '${group.group_name}', '${muscle.colloquial_name}', '${muscle.scientific_name}');\n`;
    });
  });

  return sql;
}

const sqlStatements = generateSQL(data);
console.log(sqlStatements);
