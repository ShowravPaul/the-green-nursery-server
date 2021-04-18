const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

require('dotenv').config()
app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Hello World!')
})


// for firebase token
const admin = require("firebase-admin");

const serviceAccount = require("./config/the-green-nursery-b565c-firebase-adminsdk-2ay5f-89a7d8970c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// --------------------mongodb part started here--------------------

const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('bson');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tnmnk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const serviceCollection = client.db("theGreenNursery").collection("services");
  const adminCollection = client.db("theGreenNursery").collection("admins");
  const orderCollection = client.db("theGreenNursery").collection("orders");
  const reviewCollection = client.db("theGreenNursery").collection("reviews");

  // add an order to the user database for a specific user
  app.post('/addOrder', (req, res) => {
    const newOrder = req.body;
    orderCollection.insertOne(newOrder)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

    // add a review to the database
    app.post('/addReview', (req, res) => {
      const newReview = req.body;
      reviewCollection.insertOne(newReview)
        .then(result => {
          res.send(result.insertedCount > 0);
        })
    })

      // for getting all reviews from the reviews database
  app.get('/reviews', (req, res) => {
    reviewCollection.find()
      .toArray((err, items) => {
        res.send(items);
      })
  })

  // for adding a service to the services database
  app.post('/addService', (req, res) => {
    const newService = req.body;
    serviceCollection.insertOne(newService)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

    // for deleting a service to the services database
    app.delete('/delete/:id', (req, res) => {
      serviceCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result => {
          
        })
    })

  // for getting all services from the services database
  app.get('/services', (req, res) => {
    serviceCollection.find()
      .toArray((err, items) => {
        res.send(items);
      })
  })

  // for getting all orders from the services database
  app.get('/orders', (req, res) => {
    orderCollection.find()
      .toArray((err, items) => {
        res.send(items);
      })
  })

  // for getting all admins from the admins database
  app.get('/admins', (req, res) => {
    adminCollection.find()
      .toArray((err, items) => {
        res.send(items);
      })
  })

  // for adding a new admin
  app.post('/addAdmin', (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  // for getting all orders of a specific user from orders
  app.get('/myOrderList', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];

      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
            // console.log(queryEmail);
            
          if (tokenEmail == queryEmail) {
            orderCollection.find({ email: queryEmail })
              .toArray((error, documents) => {
                res.status(200).send(documents);
              })
          }
          else {
            res.status(401).send('un-authorized access');
          }
        })
        .catch((error) => {
          res.status(401).send('un-authorized access');
        });
    }
    else {
      res.status(401).send('un-authorized access');
    }

  })

});


app.listen(process.env.PORT || port);