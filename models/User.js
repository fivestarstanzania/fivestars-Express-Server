import { Schema, model } from 'mongoose';

const userSchema = new Schema(
    {
    
    email: { 
        type: String, 
        required: [true, "Please provide an Email!"], 
        unique: [true, "Email Exist"], 
    },
    password: {
            type: String,
            required: [true, "Please provide a password!"],
            unique: false,
          },
    name: { type: String, required: true },
    universityName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, default: 'customer' }, // 'customer' or 'seller'
    applicationStatus: { type: String, default: 'none' }, // 'none', 'pending', 'approved', 'declined'
    brandLogo: { type: String, default: '' },
}, {timestamps:true}
);

export default model('User', userSchema);
