const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51JAzCYHvF1PnZH9PItbISxEqbtauawKEOabrBPnzx2RevgGBItDBLEWdszj69VpdfjBAsSzYZ76Ortcm0LD3H20J00MvOAO4Ns');

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

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected yo"      
      break;
  }

  res.render('checkout', {
    title: title,
    amount: amount,
    item: item,
    error: error
  });
});

/**
 * Success route
 */
app.get('/success', function(req, res) {
  doSuccess(req,res);
});

async function doSuccess(req, res)
{
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  res.render('success');
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
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Stubborn Attachments',
            images: ['https://i.imgur.com/EHyR2nP.png'],
          },
          unit_amount: 2000,
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
            name: 'Stubborn Attachments',
            images: ['https://i.imgur.com/EHyR2nP.png'],
          },
          unit_amount: 2000,
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
