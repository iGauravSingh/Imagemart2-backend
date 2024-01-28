const express = require("express");
const router = express.Router();
const { prisma } = require("../db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// Endpoint to retrieve product details
router.get('/get-product-details', async (req, res) => {
    const { productName } = req.query;
  
    try {
      const product = await prisma.product.findUnique({
        where: {
          name: productName,
        },
      });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      res.json(product);
    } catch (error) {
      console.error('Error retrieving product details:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Endpoint to create a checkout session
  router.post('/create-checkout-session', async (req, res) => {
    const { productName, userId } = req.body;
  
    try {
      // Retrieve product details
      const product = await prisma.product.findUnique({
        where: {
          name: productName,
        },
      });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Create a checkout session with product details
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: productName,
              },
              unit_amount: product.price * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:5173/success',
        cancel_url: 'http://localhost:5173/cancel',
        metadata: {
          userId: userId,
          // Add other necessary metadata based on your data model
        },
      });
  
      res.json({ id: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Webhook endpoint
  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const payload = req.body;
  
    try {
      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(
        payload,
        sig,
        'your_stripe_endpoint_secret'
      );
  
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
  
        // Retrieve product details based on the session
        const productName = session.display_items[0].custom.name;
        const product = await prisma.product.findUnique({
          where: {
            name: productName,
          },
        });
  
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
  
        // Save payment information in the database
        await prisma.payment.create({
          data: {
            amount: session.amount_total,
            currency: session.currency,
            userId: userId,
            product: {
              connect: {
                id: product.id,
              },
            },
          },
        });
  
        console.log('Payment successfully processed');
      }
  
      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  module.exports = router;