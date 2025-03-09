import mongoose from "mongoose"

const Schema = mongoose.Schema

const profileSchema = new Schema({
  bio: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, {
  timestamps: true
})

export default mongoose.model('Profile', profileSchema)