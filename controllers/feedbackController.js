import Feedback from '../models/feedbackModel.js';
import User from '../models/User.js'; // Assuming you don't need `.default` with ES modules

// Post feedback
export const postFeedback = async (req, res) => {
    const { feedback } = req.body; // User only provides feedback

    try {
        // Extract userId from the logged-in user's session or token (e.g., req.user set by authentication middleware)
        const user = req.user; // Assuming `req.user` contains the authenticated user's info

        // Find user by their ID
        //const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else {
            console.log(user);
        }

        // Create feedback with username and email included
        const newFeedback = new Feedback({
            feedback,
            username: user.name,
            email: user.email,
        });

        await newFeedback.save();

        res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all feedback
export const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        
        const totalFeedbacks = await Feedback.countDocuments();

       
        res.status(200).json({
            total: totalFeedbacks,
            feedbacks
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
