const jp = require('jsonpath');
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser');
const { exception } = require('console');
//This doesn't seem ideal to commit to a repo
const stripe = require('stripe')('sk_test_51JAzCYHvF1PnZH9PItbISxEqbtauawKEOabrBPnzx2RevgGBItDBLEWdszj69VpdfjBAsSzYZ76Ortcm0LD3H20J00MvOAO4Ns');

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

//This was a PITA
//https://stackoverflow.com/questions/65157367/stripe-webhook-constructevent-method-is-returning-400-error-when-pointed-to-ec2

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
      req.rawBody = buf.toString();
  }
};
app.use(express.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(express.json({ verify: rawBodyBuffer }));




/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item =req.query.item ;
  let title, amount, error;
  let productInfo = getProductInfo(item);
  if(typeof productInfo === 'undefined');
  {
    throw new exception('No product found for ID: ' + item);
  }

  res.render('checkout', {
    title: productInfo.title,
    amount: productInfo.amount,
    item: productInfo.id,
    error: error
  });
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

  res.render('success'), {
    amount: lineItem.amount_total / 100
  ,title: lineItem.description
  ,email: session.customer_details.email
  ,image_url: getProductInfo(lineItem.description,"title")[0].image_url
  }
  
  /* 
  , {
  
  ,image: 'asdf'
  });
  */
}



app.post('/success', function(req, res) {
  res.render('success');
});

 app.post('/webhook', function(req,res) {
  
  let event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], 'whsec_s7pcgQoSOkWOJqMi2IUu5ujeiRYmMvV');
  let eventBody = event.data;
  if (event.type === 'charge.succeeded')
  {
    console.log(eventBody);
  }
}); 



/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});


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
          unit_amount: productInfo.amount,
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


app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productInfo.title,
            images: [productInfo.image],
          },
          unit_amount: productInfo.amount,
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
