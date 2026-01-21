const mongoose = require("mongoose");

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
  },
  { _id: false }
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
        values: ['☺️', '😢', '😰', '🤩', '🙏', '😫'],
        message: '{VALUE} is not a valid mood'
      }
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
    goal1: {
      type: String,
      trim: true
    },
    goal2: {
      type: String,
      trim: true
    },
    goal3: {
      type: String,
      trim: true
    },
    deliveryInterval: {
      type: String,
      enum: ['1week', '2weeks', '1month', '6months', '1year', '5years', 'custom'],
      required: true
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
