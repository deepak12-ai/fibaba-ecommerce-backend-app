import express from 'express'
import Order from './orderModel.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import verifyToken from '../middleware/verifyToken.js';
import verifyAdmin from '../middleware/verifyAdmin.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

//create checkout session
router.post('/create-checkout-session', async (req, res) => {
    const {products} = req.body;
    try {
        const lineItems = products.map((product) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: product.name,
                    images: [product.image]
                },
                unit_amount: Math.round(product.price * 100)
            },
            quantity: product.quantity
        }))
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/cancel`
        })
        res.json({id: session.id})
    } catch (error) {
            console.error('Error while creating checkout session', error );
            res.status(500).json({message: "Failed to create checkout session"})
    }
})
//confirm payment
router.post('/confirm-payment', async (req, res) => {
    const {session_id} = req.body;
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id,{
            expand: ['line_items', "payment_intent"],
        });

        const paymentIntentId = session.payment_intent.id;
        let order = await Order.findOne({orderId: paymentIntentId});

        if(!order){
            const lineItems = session.line_items.data.map((item) => ({
                productId: item.price.product,
                quantity: item.quantity
            }));
            const amount = session.amount_total / 100;
            order = new Order({
                orderId: paymentIntentId,
                products: lineItems,
                amount: amount,
                email: session.customer_details.email,
                status: session.payment_intent.status === "succeeded" ? 'pending' : 'failed'
            })
        } else{
            order.status= session.payment_intent.status === "succeeded" ? 'pending' : 'failed';
        }
            await order.save();
            res.json({order})
    } catch (error) {
        console.error('Error while confirming payment', error );
        res.status(500).json({message: "Failed to confirm payment"})
    }
})
//get order by email address
router.get('/:email', async (req, res) => {
    const email = req.params.email;
    if(!email){
      return  res.status(400).send({message: "Email is required"});
    }
    try {
        const orders = await Order.find({email: email});
        if( orders.length === 0 || !orders ){
            return res.status(400).send({orders: 0, message: "No order found for this email"});
        }
        res.status(200).send({orders})
    } catch (error) {
        console.error('Error while fetching order by email', error)
        res.status(500).send({message: "Failed to fetch order by email"})
    }
})
//get order by id
router.get('/order/:id', async (req, res) => {
     try {
        const order = await Order.findById(req.params.id);
        if(!order){
            return res.status(404).send({message: "Order not found"})
        }
        res.status(200).send(order)
        
     } catch (error) {
        console.error('Error while fetching order by user id', error)
        res.status(500).send({message: "Failed to fetch order by user id"})
     }
})
//get all order
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
            if(orders.length === 0){
                return res.status(404).send({message: "No orders found", orders: []})
            }
        res.status(200).send(orders)
    } catch (error) {
        console.error('Error while fetching all order', error)
        res.status(500).send({message: "Failed to fetch all order"})      
    }
})
//update order status
router.patch('/update-order-status/:id', async(req, res) => {
    const {id} = req.params;
    const {status} = req.body;
    if(!status){
        return res.status(400).send({message: "Status is required"});
    }
    try {
        const updateOrder = await Order.findByIdAndUpdate(id, {
            status,
            updatedAt: new Date()
        },
        {
            new: true,
            runValidators: true
        });

        if(!updateOrder){
            return res.status(404).send({message: "Order not found"})
        }
        res.status(200).json({
            message: "Order status updated successfuly",
            order: updateOrder
        })
    } catch (error) {
        console.error('Error while updating order status', error)
        res.status(500).send({message: "Failed to updating order status"})    
    }
})
//delete order 
router.delete('/delete-order/:id', async (req, res) => {
    const  {id} = req.params;
    try {
        const deleteOrder = await Order.findByIdAndDelete(id);
        if(!deleteOrder){
            return res.status(404).send({message: "Order not found"})
        }
        res.status(200).json({
            message: "Oeder deleted successfuly",
            order: deleteOrder
        })
    } catch (error) {
        console.error('Error while deleting order', error)
        res.status(500).send({message: "Failed to deleting order"})    
    }
})
export default router;