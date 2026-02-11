const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    firstname: { type: String, required: true, trim: true, maxlength: 50 },
    lastname: { type: String, required: true, trim: true, maxlength: 50 },
    password: { type: String, required: true, minlength: 4 }
  },
  { timestamps: { createdAt: 'createon', updatedAt: false } }
);

module.exports = mongoose.model('User', userSchema);
