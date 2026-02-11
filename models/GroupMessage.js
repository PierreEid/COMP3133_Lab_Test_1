const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema(
  {
    from_user: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: { createdAt: 'date_sent', updatedAt: false } }
);

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
