import express from 'express';
import User from '../users/userModel.js';
import Order from '../orders/orderModel.js';
import Reviews from '../reviews/reviewModal.js';
import Products from '../products/productsModel.js';

const router = express.Router();

//user stats by email
router.get('/user-stats/:email', async (req, res) => {
    const {email} = req.params;
    if(!email){
        return res.status(400).send({message: "Email is required"});
    }
    try {   
        const user = await User.findOne({email: email})
        if(!user){
            return res.status(404).send({message: "User not found"});
        }
        //sum of all orders
        const totalPaymentResult = await Order.aggregate([
            { $match: {email: email}},
            {
                $group: { _id: null, totalAmount: { $sum: "$amount"} }
            }
        ])
        const totalPaymentsAmount =  totalPaymentResult.length > 0 ? totalPaymentResult[0].totalAmount : 0

        //get total review
        const totalReview = await Reviews.countDocuments({userId: user._id});

        //total purchased product
        const purchasedProductIds = await Order.distinct("products.productId", {email: email});
        const totalPurchasedProducts = purchasedProductIds.length;

        res.status(200).send({
            totalPayments: totalPaymentsAmount.toFixed(2),
            totalReview,
            totalPurchasedProducts
        })

    } catch (error) {
        console.error("Error while fetching user stats", error);
        res.status(500).send({message: "Faild to fetch user stats"})
    }

});
//admin stats
router.get('/admin-stats', async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Products.countDocuments();
        const totalReviews = await Reviews.countDocuments();
        const totalUsers = await User.countDocuments();

        //calculate total earning
        const totalEarningResult = await Order.aggregate([
            {$group:{
                _id: null,
                totalEarning: {$sum: '$amount'}
            }}
        ])
        const totalEarning = totalEarningResult.length > 0 ? totalEarningResult[0].totalEarning : 0;

        const monthlyEarningResult = await Order.aggregate([
            {
                $group: {
                    _id: {month: {$month: "$createdAt"}, year: {$year: "$createdAt"}},
                    monthlyEarnings: {$sum: "$amount"}
                }
            },
            {
                $sort: {"_id.year" : 1, "_id.month" : 1}
            }
        ])
        const monthlyEarning = monthlyEarningResult.map((entry) => ({
            month: entry._id.month,
            year: entry._id.year,
            earnings: entry.monthlyEarnings.toFixed(2)
        }))
        res.status(200).json({
            totalOrders,
            totalProducts,
            totalReviews,
            totalUsers,
            totalEarning,
            monthlyEarning
        })
    } catch (error) {
        console.error("Error while fetching Admin stats", error);
        res.status(500).send({message: "Faild to fetch Admin stats"})
    }
})
export default router;