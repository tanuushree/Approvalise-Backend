const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approverPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  //approverPath: [{ type: String, required: true }],
  currentApproverIndex: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  statusMap: { type: Map, of: String, enum: ['approved', 'pending', 'rejected'] },
  updatedAt: { type: Date, default: Date.now },
  rejectMessage: { type: String || null, default: null }
}, {
  timestamps: true,
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;






