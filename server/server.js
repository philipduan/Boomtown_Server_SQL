const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'boomtown',
  password: 'password',
  port: '5432'
});

pool.connect(() => {
  console.log('connected')
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello SQL World');
});

//GET ALL items
app.get('/items', (req, res) => {
  return pool.query(`SELECT i.*, u.fullname as ownername, u.email as owneremail, u.bio as ownerbio, z.fullname as borrowername, z.email as borroweremail, z.bio as borrowerbio 
                    FROM items i
                      LEFT OUTER JOIN users u 
                        ON i.itemowner=u.userid
                      LEFT OUTER JOIN users z
                         ON i.borrower=z.userid`).then(response => {
      res.send(response.rows);
    });
});

//Create a new item and insert
app.post('/items', (req, res) => {
  const { title, description, imageurl, tags, itemowner, created, available, borrower } = req.body;
  console.log('Body', req.body);
  const query = {
    text:
      'INSERT INTO items (title, description, imageurl, tags, itemowner, created, available, borrower) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    values: [title, description, imageurl, tags, itemowner, created, available, borrower]
  };
  return pool
    .query(query)
    .then(response => {
      res.send(response.rows[0]);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

//Update document of Item collection == item borrowed or returned by a user
app.patch('/items', (req, res) => {
  const { itemid, available, borrower } = req.body;
  const query = {
    text: 'UPDATE items SET borrower=$3, available =$2 where itemid=$1 RETURNING *',
    values: [itemid, available, borrower]
  }
  return pool
    .query(query)
    .then(response => {
      res.status(200).send(response.rows[0])
    })
    .catch(err => {
      res.status(400).send(err);
    })
});

//Delete document of Item collection == current user can delete their owned item
app.delete('/items', (req, res) => {
  const { id } = req.body;
  return pool
    .query('DELETE FROM items WHERE itemid=$1 RETURNING *')
    .then(response => {
      res.status(200).send(response.rows[0])
    })
    .catch(err => {
      res.status(400).send(err);
    })

})

//GET ALL users
app.get('/users', (req, res) => {
  return pool.query('SELECT * FROM users').then(response => {
    res.send(response.rows);
  });
});


//Get specific user by their Id
app.get('/users/:id', (req, res) => {
  return pool
    .query('SELECT * FROM users WHERE userid = $1', [req.params.id])
    .then(response => {
      res.send(response.rows[0]);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

//Get specifice user document using email
app.post('/email', (req, res) => {
  return pool
    .query('SELECT * FROM users WHERE email = $1', [req.body.email])
    .then(response => {
      res.status(200).send(response.rows[0]);
    })
    .catch(err => {
      res.status(200).send(err);
    })
})

//Create a new user and insert
app.post('/users', (req, res) => {
  const { email, fullname, bio } = req.body;
  console.log('Body', req.body);
  const query = {
    text:
      'INSERT INTO users (email, fullname, bio) VALUES ($1, $2, $3) RETURNING *',
    values: [email, fullname, bio]
  };
  return pool
    .query(query)
    .then(response => {
      res.send(response.rows[0]);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});


app.listen(PORT, () => {
  console.log(`Server Started On Port ${PORT}`)
});