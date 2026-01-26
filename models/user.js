const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
     },
     name: {
      type: String,
      default: ''
     },
     email: {
      type: String,
      default: ''
     },
     birthday: {
      type: Date
     },
     settings: {
      celebrationsEnabled: {
        type: Boolean,
        default: true
      },
      birthdayOomph: { type: Boolean, default: true },
      milestoneOomph: { type: Boolean, default: true },
      anniversaryOomph: { type: Boolean, default: true },
      letterDeliveryOomph: { type: Boolean, default: true },
      goalAccomplishedOomph: { type: Boolean, default: true },
      streakOomph: { type: Boolean, default: true }
     },
      stats: {
      totalLetters: { type: Number, default: 0 },
      totalReflections: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActivityDate: { type: Number, default: 0 },
      goalsAccomplished: { type: Number, default: 0 },
    }
    }, { timestamp: true });

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;