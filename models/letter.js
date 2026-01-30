const mongoose = require("mongoose");
const { VALID_INTERVALS } = require("../utils/dateCalculator");

// Schema for reflections - thoughts the user adds after receiving their letter
const reflectionSchema = new mongoose.Schema(
  {
    reflection: {
      type: String,
      required: [true, "Reflection content is required"],
      minLength: [50, "Reflection must be at least 50 characters long"], // Encourages meaningful reflections
      trim: true
    },
    date: {
      type: Date,
      default: Date.now // Automatically records when the reflection was written
    }
  }
);

// Schema for goals - personal objectives the user sets for their future self
const goalSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Goal text is required'],
      trim: true,
      maxLength: [150, 'Goal cannot exceed 150 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'accomplished', 'inProgress', 'abandoned', 'carriedForward'], // Tracks goal progress
      default: 'pending'
    },
    reflection: {
      type: String,
      trim: true,
      maxLength: [500, 'Goal reflection cannot exceed 500 characters'] // User's thoughts on this specific goal
    },
    carriedForwardTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter' // Links to the new letter where this goal continues
    },
    carriedForwardFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter' // Links to the original letter where this goal came from
    },
    statusUpdatedAt: {
      type: Date // Records when the goal status was last changed
    }
  }
);

// Main letter schema - the core document representing a letter to future self
const letterSchema = new mongoose.Schema(
  {
    // Who wrote this letter (references the User collection)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // Speeds up queries filtering by user
    },

    // Letter title (optional, defaults to "Untitled")
    title: {
      type: String,
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"],
      default: "Untitled"
    },

    // Emotional state when writing (emoji-based mood tracking)
    mood: {
      type: String,
      enum: {
        values: ['', '☺️', '😢', '😰', '🤩', '🙏', '😫'],
        message: '{VALUE} is not a valid mood'
      },
      required: false
    },

    // Context capturing - weather and temperature at time of writing
    weather: {
      type: String,
      trim: true
    },
    temperature: {
      type: Number
    },

    // Song attachment - what the user was listening to (legacy field)
    currentSong: {
      type: String,
      trim: true
    },

    // Song details from iTunes API - stores full track information
    song: {
      trackName: {
        type: String,
        trim: true
      },
      artistName: {
        type: String,
        trim: true
      },
      artworkUrl: {
        type: String,
        trim: true // Album cover image URL
      },
      previewUrl: {
        type: String,
        trim: true // 30-second audio preview URL
      }
    },

    // News headline of the day - captures what was happening in the world
    topHeadLine: {
      type: String,
      trim: true
    },

    // Where the user was when writing the letter
    location: {
      type: String,
      trim: true
    },

    // The main letter body - the actual message to future self
    content: {
      type: String,
      required: [true, "Letter content is required"],
      trim: true,
      maxLength: [5000, "Letter is too long (max 5000 chars)"]
    },

    // Array of goals the user wants to achieve (max 3 enforced in service layer)
    goals: [goalSchema],

    // Original drawing created when writing the letter (base64 encoded image)
    drawing: {
      type: String,
      trim: true
    },

    // Drawing added after delivery - allows user to add art when reflecting
    overlayDrawing: {
      type: String,
      trim: true
    },

    // When the user wants to receive the letter (1week, 1month, 6months, 1year, 5years, custom)
    deliveryInterval: {
      type: String,
      enum: {
        values: VALID_INTERVALS,
        message: '{VALUE} is not a valid delivery interval. Choose from: ' + VALID_INTERVALS.join(', ')
      },
      required: [true, 'Please tell us when you want to receive your letter']
    },

    // The exact date when the letter will be "delivered" (unlocked for reading)
    deliveredAt: {
      type: Date,
      required: true,
      validate: {
        /**
         * Custom validator: Ensures delivery date is at least 7 days in the future
         *
         * Why this exists:
         * - Letters to your future self should have time to "age"
         * - Prevents users from immediately reading what they just wrote
         * - The waiting period makes the reflection more meaningful
         *
         * When it runs:
         * - this.isNew: true when creating a brand new letter
         * - this.isModified('deliveredAt'): true when rescheduling an existing letter
         *
         * When it skips validation:
         * - When updating other fields (like marking isDelivered = true)
         * - This prevents the validator from blocking routine updates
         */
        validator: function (value) {
          // Only enforce the 7-day rule for new letters or when changing the delivery date
          const isNewLetter = this.isNew;
          const isRescheduling = this.isModified('deliveredAt');

          if (isNewLetter || isRescheduling) {
            // Step 1: Get today's date at midnight UTC (removes time portion)
            // Using UTC prevents timezone differences from affecting the calculation
            const today = new Date();
            const todayAtMidnightUTC = Date.UTC(
              today.getUTCFullYear(),
              today.getUTCMonth(),
              today.getUTCDate()
            );

            // Step 2: Calculate the minimum allowed date (7 days from today)
            const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
            const minimumDeliveryDateMs = todayAtMidnightUTC + sevenDaysInMilliseconds;

            // Step 3: Convert the user's chosen date to midnight UTC for fair comparison
            const chosenDate = new Date(value);
            const chosenDateAtMidnightUTC = Date.UTC(
              chosenDate.getUTCFullYear(),
              chosenDate.getUTCMonth(),
              chosenDate.getUTCDate()
            );

            // Step 4: Check if chosen date is at least 7 days away
            const isDateFarEnoughInFuture = chosenDateAtMidnightUTC >= minimumDeliveryDateMs;
            return isDateFarEnoughInFuture;
          }

          // Skip validation for other updates (e.g., marking letter as delivered)
          return true;
        },
        message: 'Delivery date must be at least one week in the future.'
      }
    },

    // Whether the delivery date has passed and the letter can be read
    isDelivered: {
      type: Boolean,
      default: false,
      index: true // Speeds up queries for delivered vs pending letters
    },

    // Array of reflections added after the letter is delivered
    reflections: [reflectionSchema]
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Letter = mongoose.model('Letter', letterSchema);
module.exports = Letter;
