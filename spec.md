# Uplifting Mobile App

A fitness tracking app focused on workout logging, progress visualization, and sharing with friends.

## Authentication

- **Login/Signup**: Username + password authentication (already implemented)
- **Password Reset**: Email-based password reset flow
- **Account Deletion**: Available in Settings page (GDPR compliance)
- **Profile Editing**: Users can update their name and avatar

## Workout Page

Multi-screen layout (left to right horizontal scrolling) where each screen represents an exercise in the current workout. The last page is an "Add Exercise" button.

### Workout Lifecycle

- **Start**: Implicit when first exercise is added, or via explicit "Start Workout" button
- **Active State**: Persisted locally so workouts survive app restarts
- **Finish Button**: Top-right corner, opens workout summary screen
  - Summary shows: exercises performed, sets completed, total volume, duration
  - "Save" button closes and persists the workout
  - "Cancel" button resumes the workout (does not discard)
- **Resume**: Workouts started within the last 24 hours can be resumed
- **Auto-Cap**: If the app is closed without finishing, the workout auto-ends at the configured max duration (default 2 hours)

### Exercise Selection (Add Exercise Page)

- **Sorting**:
  1. Favourites first
  2. Most likely to do next (weighted based on previous N exercises in session)
  3. Remaining exercises sorted alphabetically, split by first letter
- **Filtering**: By class (machine, freeweight, bodyweight), primary muscle, or muscle group
- **Actions**:
  - Quick-add button: Adds exercise immediately, skipping detail screens
  - Row tap: Opens exercise detail screen

### Exercise Detail Screen

- Highlighted muscle diagram showing primary muscle and muscle group
- Exercise title, class, recorded PR, and predicted max ("coming soon" placeholder)
- PR Progress graph with time ranges: month, 6 months, YTD, year, all time
- Data table: primary muscles, secondary muscles, optional YouTube tutorial link

### Exercise Profiles

When adding an exercise, users can select a "profile" (e.g., "wide grip", "close grip", "incline"). Profiles affect:

- Personal records (tracked separately per profile)
- Previous session recommendations

### Set Logging

- Table interface to add sets with reps and weight
- Previous session data shown as grayed-out defaults (for the same exercise + profile)
- Users can edit or delete individual sets

### Exercise Management

- **Reorder**: Button opens a modal with drag-to-reorder list of current exercises
- **Remove**: Swipe-to-delete on exercise screens
- **Custom Exercises**: Users can create their own exercises (marked as non-official)

## Me Page

- **Muscle Chart**: Shows this week's training coverage
  - Gray: Untrained muscles
  - Light theme color: Secondarily trained muscles
  - Dark theme color: Primarily trained muscles
  - Title displays "n% of muscles worked this week"
- **Sync Banner**: When offline, displays a banner with manual "Sync" button to retry

## Friends Page

Strava-like activity feed for friends' workouts.

### Friend Discovery

- Search by username
- QR code sharing for easy friend adding

### Friend Management

- Send/accept/decline friend requests
- Unfriend or block users

### Feed Content

- Workout stats: total volume (sum of reps × weight), time in gym
- Gym location (if user has enabled location sharing)
- Workout name (user-defined or inferred from exercises)

### Privacy Settings (per workout)

- "Friends only": Visible to friends
- "Private": Not shared with anyone
- No global/public sharing option - this is not primarily a social media app

## Stats Page

### Primary Stats (shown on main view)

- Total volume (all time)
- Total time in gym
- Number of workouts
- Number of sets
- Number of reps

### Other Stats (accessible via menu)

- **Workout History**: View and edit past workouts
- **Favourite Exercises**: Filtered by month/year/all time
  - Shows exercise title + number of sets completed
  - Tapping a row opens the exercise detail screen

## Settings Page

- **Display Unit**: Auto-detect from device locale, switchable between kg and lbs (display only - see Units section)
- **Default Rest Timer**: Configurable duration in seconds
- **Max Workout Duration**: Default 2 hours, can increase or disable
- **Privacy Defaults**: Default sharing preference for new workouts
- **Gym Location Sharing**: Toggle whether gym location is shared on workouts
- **Notification Preferences**: Configure push notification settings
- **Account**:
  - Edit profile (name, avatar)
  - Change password
  - Delete account
- **Logout**

## Offline Support

Local-first architecture ensures the app works without network connectivity.

- **Local Storage**: All data saved to device storage before syncing to server
- **Sync Queue**: Pending changes stored locally, synced when online
- **Offline Indicator**: Banner on "Me" page when disconnected
- **Manual Sync**: Button to force retry sync
- **Conflict Resolution**: Last-write-wins with server timestamps

## Units and Week Definition

### Weight Units

- **Storage**: Each set stores the weight AND the unit it was logged in (e.g., 10 lbs, not converted to kg)
- **Display**: User preference controls how weights are displayed
- **Conversion**: Switching display units converts and rounds for viewing only - stored values are never modified

### Week Definition

- "This week" = Sunday to Saturday

## The Muscle Chart

A data-driven SVG component showing trainable muscles:

- Front view and back view
- Each relevant muscle (quads, calves, biceps, triceps, etc.) is individually addressable/colorable
- Colors indicate training status (untrained, secondary, primary)

## Data Model

### New Database Tables/Columns

```sql
-- user_sets: add weight and unit (store original logged value)
ALTER TABLE user_sets ADD COLUMN weight DECIMAL NOT NULL;
ALTER TABLE user_sets ADD COLUMN weight_unit VARCHAR(3) NOT NULL; -- 'kg' or 'lbs'

-- exercise profiles (variations like "wide grip", "close grip")
CREATE TABLE exercise_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    exercise_id UUID REFERENCES exercises(id),
    name VARCHAR(255) NOT NULL,
    UNIQUE(user_id, exercise_id, name)
);

-- link sets to profiles
ALTER TABLE user_sets ADD COLUMN profile_id UUID REFERENCES exercise_profiles(id);

-- friendships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    friend_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL, -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- workout metadata
ALTER TABLE workouts ADD COLUMN name VARCHAR(255);
ALTER TABLE workouts ADD COLUMN privacy VARCHAR(20) NOT NULL DEFAULT 'friends';
ALTER TABLE workouts ADD COLUMN gym_location VARCHAR(255);

-- user settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    display_unit VARCHAR(3) DEFAULT NULL, -- NULL = auto-detect from locale
    max_workout_duration_minutes INTEGER NOT NULL DEFAULT 120,
    default_rest_timer_seconds INTEGER NOT NULL DEFAULT 90,
    default_privacy VARCHAR(20) NOT NULL DEFAULT 'friends',
    share_gym_location BOOLEAN NOT NULL DEFAULT true
);

-- client-side sync queue (SQLite on device)
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Workouts

- `GET /api/v1/workouts` - List user's workouts
- `POST /api/v1/workouts` - Create workout
- `GET /api/v1/workouts/:id` - Get workout details
- `PUT /api/v1/workouts/:id` - Update workout
- `DELETE /api/v1/workouts/:id` - Delete workout
- `POST /api/v1/workouts/:id/sets` - Add set to workout
- `GET /api/v1/workouts/:id/summary` - Get workout summary

### Sync

- `POST /api/v1/sync` - Batch sync endpoint for offline changes

### Friends

- `GET /api/v1/friends` - List friends
- `POST /api/v1/friends` - Send friend request
- `PUT /api/v1/friends/:id` - Accept/decline/block friend
- `DELETE /api/v1/friends/:id` - Remove friend
- `GET /api/v1/feed` - Get friends' activity feed

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/settings` - Get user settings
- `PUT /api/v1/users/me/settings` - Update settings
- `GET /api/v1/users/search?q=` - Search users by username

### Exercises

- `GET /api/v1/exercises` - List exercises with filters
- `POST /api/v1/exercises` - Create custom exercise
- `GET /api/v1/exercises/:id` - Get exercise details
