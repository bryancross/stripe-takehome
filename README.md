## Application overview
This demo is written in Javascript (Node.js) with the [Express framework](https://expressjs.com/). 

We're using the [Bootstrap](https://getbootstrap.com/docs/4.6/getting-started/introduction/) CSS framework. It's the most popular CSS framework in the world and is pretty easy to get started with — feel free to modify styles/layout if you like. 

To simplify this project, we're also not using any database here, either. Instead `app.js` includes a simple switch statement to read the GET params for `item`. 

NOTE: I modified this a bit by storing the product info in a JSON object, which made it available for other purposes in the app.  For example, it was handy to be able [to 'look up' a product](https://github.com/bryancross/stripe-takehome-with-elements/blob/main/app.js#L68) based on the value of any of its attributes.  

## Prerequisites 

1. If you don't already have one, setup a [Stripe Test Account](https://stripe.com/docs/connect/testing).
1. Get your Stripe [API Keys](https://stripe.com/docs/keys) and store them in a safe place.  

## Getting Started

To get started
1. Clone the repository and run `npm install` to install dependencies

```
git clone git@github.com:bryancross/stripe-takehome-with-elements.git && cd stripe-takehome-with-elements
npm install
```
2. Copy `.env.example` to `.env` 

```
cp .env.example .env
```

3. Update `.env` with your Publishable and Secret Stripe API keys.  

```
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
```

4. Run the application locally:

```
npm start
```

5. Navigate to [http://localhost:3000](http://localhost:3000) to view the index page.
6. Select a book to purchase by clicking on the blue `Purchase ` button.  
7. You can use `4242 4242 4242 4242` as your credit card number, any valid date later than the current data for expiration, and any three digits for the CVC code.  This card does _not_ require additional authentication.  

If you want to give authentication a shot you can use `4000 0027 6000 3184`

More info on test cards and integration testing in the [Stripe documentation](https://stripe.com/docs/testing)

## Approach and Experience

I originally misread the instructions by assuming that the term 'Stripe Elements' was a referring generally to 'page elements' and not specifically reference to the eponymous Stripe product/API.  As a result I spent about 8 hours completing this project using a [Stripe Checkout Session](https://stripe.com/docs/api/checkout/sessions/create).  Once I realized my mistake I reverted a bit and then implemented the solution using Elements.   

There was the usual amount of googling and rooting around in Stack Overflow to help me understand the nuances of implementing Elements.  However, it was this short, concise, and extremely clear [tutorial](https://w3collective.com/stripe-payment-node/) that helped me to successfully implement the Elements-based solution in a couple of hours.  

### Areas for Improvement
1. Can't quite get the style right on `checkout.hbs`, so the card element is a little smooshed on the page. 
2. Since there's no obvious way to create/access line items as there is with Checkout Sessions, I'm retrieving some info for the Success page either by persisting it in hidden `INPUT` elements or just looking it up again from my static JSON data given the Item ID.  I prefer displaying data to the user based on what Stripe thinks happened, rather than using this approach.  
3. I would love to explore using more of the Stripe product set and API.  For example, setting up products, customers, etc., seems like it would be interesting and fun.  
