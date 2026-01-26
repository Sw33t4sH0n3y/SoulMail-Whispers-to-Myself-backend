const mongoose = require("mongoose");
const { VALID_INTERVALS } = require("../utils/dateCalculator");

const reflectionSchema = new mongoose.Schema(
  {
    reflection: {
      type: String,
      required: [true, "Reflection content is required"],
      minLength: [50, "Reflection must be at least 50 characters long"],
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }
);

const goalSchema = new mongoose. Schema(
  {
    text: {
      type: String,
      required: [true, 'Goal text is required'],
      trim: true,
      maxLength: [150, 'Goal cannot exceed 150 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'inProgress', 'abandoned', 'carriedForward'],
      default: 'pending'
    },
    reflection: {
      type: String,
      trim: true,
      maxLength: [500, 'Goal reflection cannot exceed 500 characters']
    },
    carriedForwardTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter'
    },
    carriedForwardFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter'
    },
    statusUpdatedAt: {
      type: Date
    }
  }
);

const letterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"],
      default: "Untitled"
    },
    mood: {
      type: String,
      enum: {
        values: ['', '☺️', '😢', '😰', '🤩', '🙏', '😫'],
        message: '{VALUE} is not a valid mood'
      },
      required: false
    },
    weather: {
      type: String,
      trim: true
    },
    temperature: {
      type: Number
    },
    currentSong: {
      type: String,
      trim: true
    },
    topHeadLine: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: [true, "Letter content is required"],
      trim: true,
      maxLength: [5000, "Letter is too long (max 5000 chars)"]
    },

    goals: [goalSchema],
    
    deliveryInterval: {
      type: String,
      enum: {
        values: VALID_INTERVALS,
        message: '{VALUE} is not a valid delivery interval. Choose from: ' + VALID_INTERVALS.join(', ')
      },
      required: [true, 'Please tell us when you want to receive your letter']
    },
    deliveredAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // If we are creating a new letter
          // OR modifying the delivery date (rescheduling),
          // strict validation applies: Date must be at least 24 hours in the future.
          if (this.isNew || this.isModified('deliveredAt')) {
            const tomorrow = new Date();
            tomorrow.setHours(tomorrow.getHours() + 24);
            return value >= tomorrow;
          }
          // If simply updating other fields (like isDelivered status), skip date validation
          return true;
        },
        message: 'Delivery date must be at least 24 hours in the future.'
      }
    },
    isDelivered: {
      type: Boolean,
      default: false,
      index: true
    },
    reflections: [reflectionSchema]
  },
  { timestamps: true }
);

const Letter = mongoose.model('Letter', letterSchema);
module.exports = Letter;
