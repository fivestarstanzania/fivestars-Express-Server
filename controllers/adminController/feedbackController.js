import Feedback from '../../models/feedbackModel.js';

export const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        const totalFeedbacks = await Feedback.countDocuments();
        res.status(200).json({
            total: totalFeedbacks,
            feedbacks
        });
    } catch (err) {
        //console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};