import express from 'express';
import nunjucks from 'nunjucks';
import morgan from 'morgan';
import session from 'express-session';
import users from './users.json' assert { type: 'json' };
import stuffedAnimalData from './stuffed-animal-data.json' assert { type: 'json' };

const app = express();
const port = '8000';

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: false }));

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

function getAnimalDetails(animalId) {
  return stuffedAnimalData[animalId];
}

app.get('/', (req, res) => {
  res.render('index.html');
});

app.get('/all-animals', (req, res) => {
  res.render('all-animals.html.njk', { animals: Object.values(stuffedAnimalData) });
});

app.get('/animal-details/:animalId', (req, res) => {
  console.log(req.params)
  res.render('animal-details.html.njk', { animal: getAnimalDetails(req.params.animalId) });
});

app.get('/add-to-cart/:animalId', (req, res) => {
  //created a session and an parameter id variable.
  const ses = req.session
  const animalId = req.params.animalId
  //if the cart key in the ses object is non existent, create a cart
  if (!ses.cart) {
    ses.cart = {}
  }
  //if the animalId parameter is not in the cart, set cart to 0
  if (!(animalId in ses.cart)) {
    ses.cart[animalId] = 0
  }
  //else, add it to the cart's current contents.
  ses.cart[animalId] += 1
  console.log(ses.cart)
  
  res.redirect('/cart')
})

app.get('/cart', (req, res) => {
  const ses = req.session
  if (!ses.cart) {
    ses.cart = {}
  }

  let animalArray = []
  let totalCost = 0
  const cart = ses.cart

  for(let animalId in cart) {
    const getDetails = getAnimalDetails(animalId)
    const amount = cart[animalId]
    getDetails.amount = amount

    const subTotal = amount * getDetails.price
    getDetails.subTotal = subTotal

    totalCost += subTotal
    animalArray.push(getDetails)
  }

  res.render('cart.html.njk', {animals: animalArray, totalCost: totalCost});
});

app.get('/checkout', (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect('/all-animals');
});

app.get('/login', (req, res) => {
  res.render('login.html.njk');
});

app.post('/process-login', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  for(const user of users) {
    if(username === user.username && password === user.password) {
      req.session.username = user.username
      res.redirect('/all-animals')
      return
    }
  }
  res.render('login.html.njk', { error: 'That username or password is incorrect. Please try again.' })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
