const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  userId: { type: String, default: uuidv4, unique: true },
  department: { type: String, required: true },
  username: { type: String, required: true, unique: true  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['approver', 'student'], required: true },
  hierarchyValue: { type: Number, enum: [0, 1, 2, 3], required: function() { return this.role === 'approver'; } }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;




