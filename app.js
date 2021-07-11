const jp = require('jsonpath');
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser');
const { exception } = require('console');
//This doesn't seem ideal to commit to a repo
const stripe = require('stripe')('sk_test_51JAzCYHvF1PnZH9PItbISxEqbtauawKEOabrBPnzx2RevgGBItDBLEWdszj69VpdfjBAsSzYZ76Ortcm0LD3H20J00MvOAO4Ns');

//Useful for formatting currencies
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

//This is still a hack, but it's more useful and reusable than the original switch statement. 
// Ideally we'd be using Stripe products for this.  
const ProductInfoDB = 
                [
                {
                  "id": 1
                  ,"title": "The Art of Doing Science and Engineering"
                  ,"amount": 2300
                  ,"image_url": "https://i.imgur.com/kG5zQlp.jpg"
                },
                {
                  "id": 2
                  ,"title": "The Making of Prince of Persia: Journals 1985-1993"
                  ,"amount": 2500
                  ,"image_url": "https://i.imgur.com/2XQEEcc.jpg"
                },
                {
                  "id": 3
                  ,"title": "Working in Public: The Making and Maintenance of Open Source"
                  ,"amount": 2800
                  ,"image_url":"https://i.imgur.com/nLT2j9z.jpg"
                }
              ];

              var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

function getProductInfo(key_value, key_name) {
  //if key is undefined, we'll default to 'id'
  
  if(typeof key_name === 'undefined')
  {
    key_name='id'
  }
  jpath = '$[?(@.' + key_name + '=="' + key_value + '")]';
  return  jp.query(ProductInfoDB, jpath);
}

/**
 * Success route
 */
app.get('/success', function(req, res) {
  doSuccess(req,res);
});

async function doSuccess(req, res)
{
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  const lineItems = await stripe.checkout.sessions.listLineItems(req.query.session_id);
  const lineItem = lineItems.data[0];

//Looking up the image_url from the title is a hack.  But, it works.
//Proper way to do this would be using Stripe products.  
//Unfortunately trying to attach this to the lineitem metadata attribute doesn't seem to persist across the
//transaction.  

  res.render('success', {
    amount: formatter.format(lineItem.amount_total / 100)
  ,title: lineItem.description
  ,email: session.customer_details.email
  ,image_url: getProductInfo(lineItem.description,"title")[0].image_url
  });
}

app.get('/create-checkout-session', async (req, res) => {
  let productInfo = getProductInfo(req.query.item)[0];
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productInfo.title,
            images: [productInfo.image_url]
            //It's too bad this doesn't appear to be a thing
            //metadata: {image_url: productInfo.image}
          },
          unit_amount: productInfo.amount
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3000/cancel`,
  });

  res.redirect(303, session.url)
});

/**
 * Start server
 */
 app.listen(3000, () => {
  console.log('Getting served on port 3000');
});