import Review from '../../models/ReviewsModel.js'
import User from '../../models/User.js';
import Seller from "../../models/sellerModel.js";
import Product from '../../models/ProductModel.js'
export const getAllReviews = async (req, res) => {
    try {
      const reviews = await Review.find()
      .populate({
        path:"userId",
        select:"email name",
        model:User
      })
      .populate({
        path:"sellerId",
        select:"email",
        model:Seller
      })
      .populate({
        path:"productId",
        select: "title imageUrl sellerId",
    populate: { path: "sellerId", select: "email name" }
      });
      const totalReviews = await Review.countDocuments();
      // Respond with both the total number and the reviews

      const formattedReviews = reviews.map((review) => ({
        reviewId: review._id,
      userEmail: review.userId ? review.userId.email : null,
      userName: review.userId ? review.userId.name : null,
      sellerEmail: review.sellerId
    ? review.sellerId.email
    : review.productId?.sellerId?.email, // get from product if product review
  sellerName: review.sellerId
    ? review.sellerId.name
    : review.productId?.sellerId?.name,
      productTitle: review.productId ? review.productId.title : null,
      productImage: review.productId ? review.productId.imageUrl : null,
      reviewText: review.reviewText,
      rating: review.rating,
      createdAt: review.createdAt, 
      }));

      //console.log(`reviews:${formattedReviews}`)

      res.status(200).json({
        total: totalReviews,
        reviews:formattedReviews,
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({message:"error fetching reviews"});
    }
}

export const deleteReview = async (req, res) => {
    //console.log('i got called to delete review')
    try {
        const { reviewId } = req.params;
        //console.log('i got called to delete review', reviewId)
        // Find and delete the review
        const deletedReview = await Review.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ message: "Review not found" });
        }
        res.status(200).json({ message: "Review deleted successfully" });

    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Error deleting review" });
    }
};

export const getReviewDetail = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate({
        path: "userId",
        select: "email name",  // you can include name if you want
        model: User
      })
      .populate({
        path: "sellerId",
        select: "email name",
        model: Seller
      })
      .populate({
        path: "productId",
        select: "title imageUrl description price", // full product info
        populate: { path: "sellerId", select: "email name" }
      });
      

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      reviewId: review._id,
      userEmail: review.userId ? review.userId.email : null,
      userName: review.userId ? review.userId.name : null,
      sellerEmail: review.sellerId
    ? review.sellerId.email
    : review.productId?.sellerId?.email, // get from product if product review
  sellerName: review.sellerId
    ? review.sellerId.name
    : review.productId?.sellerId?.name,
      productTitle: review.productId ? review.productId.title : null,
      productImage: review.productId ? review.productId.imageUrl : null,
      productDescription: review.productId ? review.productId.description : null,
      productPrice: review.productId ? review.productId.price : null,
      reviewText: review.reviewText,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching review detail" });
  }
};
