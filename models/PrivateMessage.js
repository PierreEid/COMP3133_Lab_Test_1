const mongoose = require('mongoose');

const privateMessageSchema = new mongoose.Schema(
  {
    from_user: { type: String, required: true, trim: true },
    to_user: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: { createdAt: 'date_sent', updatedAt: false } }
);

module.exports = mongoose.model('PrivateMessage', privateMessageSchema);
