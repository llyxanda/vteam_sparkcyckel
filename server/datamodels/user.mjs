import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    emmil: { type: String, required: true, unique: true }, // FIX Can't see if this code is being used anywhere, but if it is then emmil -> email.
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

export default User;
