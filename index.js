const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, serialize, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;


// middleware 
app.use(cors())
app.use(express.json())

// pass xQy06fKeTu9aPRbR
//user carDoctor



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8hd0j1r.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req , res, next )=> {
  const authorization = req.headers.authorization ;
  if(!authorization){
    return res.status(401).send({error: true , message: 'unauthorized assess'})
  }
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , (error, decoded)=>{
    if(error){
      return res.status(401).send({error: true, message: 'unauthorized assess'})
    }
    req.decoded = decoded ;
    next()
  })
  console.log(token)

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('doctorDb').collection('services') ;
    const bookingsCollection = client.db('doctorDb').collection('bookings')


    // jwt token api 

    app.post('/jwt' , (req, res)=> {
      const user = req.body ;
      console.log(user)
      var token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET ,  { expiresIn: '1h' }) ;
      res.send({token})
    })




    // services api

    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1 ,service_id: 1, img: 1},
      };
      const result = await servicesCollection.findOne(query, options)
      res.send(result)
    })


    // bookings api


    app.get('/bookings', verifyJWT, async(req, res)=> {
      console.log('comeback after verify',req.decoded)
      const decoded = req.decoded ;

      if(decoded.email !== req.query.email){
       return res.status(403).send({error: true , message: "forbidden access"})
      }

      console.log(req.query)
      let query = {}
      if(req.query?.email){
        query = {email : req.query.email}
      }
      const result = await bookingsCollection.find(query).toArray()
      res.send(result)
    })


    app.post('/bookings', async(req, res)=>{
      const booking = req.body ;
      const result = await bookingsCollection.insertOne(booking)
      res.send(result)
      console.log(booking)

    })

    app.patch('/bookings/:id', async(req, res)=>{
        const id = req.params.id ;
        const filter = {_id : new ObjectId(id)}
        const booking = req.body ;
        console.log(booking)
        const updateBooking = {
          $set:{
            status : booking.status
          }
        }
        const result = await bookingsCollection.updateOne(filter,updateBooking)
        res.send(result)
    })
 
    app.delete('/bookings/:id', async(req , res)=> {
      const id = req.params.id ;
      const query = {_id : new ObjectId(id)}
      const result = await bookingsCollection.deleteOne(query)
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('DOCTOR SERVER IS RUNNING')
})

app.listen(port, () => {
  console.log('doctor server is running on ', port)
})