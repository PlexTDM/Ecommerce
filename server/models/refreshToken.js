import mongoose from "mongoose"

const Schema = mongoose.Schema

const refreshTokenSchema = new Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

export default mongoose.model('refreshToken',refreshTokenSchema)