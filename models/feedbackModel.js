import { Schema, model } from 'mongoose';

const feedbackSchema = new Schema({
    feedback: { type: String, required: true }, // Feedback text
    username: { type: String, required: true }, // Fetched from users collection
    email: { type: String, required: true },    // Fetched from users collection
    createdAt: { type: Date, default: Date.now },
});

export default model('Feedback', feedbackSchema);