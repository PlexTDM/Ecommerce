import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Role = {
    ADMIN: 'ADMIN',
    USER: 'USER'
};

const userSchema = new Schema({
    username: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: [Role.ADMIN, Role.USER],
        required: true,
        default: Role.USER,
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);