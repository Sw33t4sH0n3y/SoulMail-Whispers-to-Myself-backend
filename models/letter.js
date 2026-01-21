const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema(
  {
    reflection: {
      type: String,
    },
    date: {
      type: Date,
      required: true
    }
  }, 
  { timestamps: true }
);

const letterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
    },
    mood: {
      type: String,
      enum: ['☺️', '😢', '😰', '🤩', '🙏', '😫'],
    },
    weather: {
    type: String
  },
  temperature: {
    type: Number
  },
  currentSong: {
    type: String
  },
  topHeadLine: {
    type: String
  },
  location: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  goal1, 
  goal2,
  goal3: {
    type: String
  },
  deliveredAt: {
    type: Date,
    required: true
  },
  isDelivered: {
    type: Boolean,
    default: false
},
reflection: [reflectionSchema]
}, {
  timestamps: true 
});

const Letter = mongoose.model('Letter', letterSchema);
module.exports = Letter;
