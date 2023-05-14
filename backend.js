const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Serve the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.post('/calculate-carbon-footprint', async (req, res) => {
  const { transportation, energy, waste } = req.body;
  const carbonInterfaceApiKey = process.env.CARBON_INTERFACE_API_KEY;

  // Calculate the carbon footprint of transportation using the Carbon Interface API
  const response = await axios.post(
    'https://www.carboninterface.com/api/v1/estimates',
    {
      data: {
        type: 'estimate',
        attributes: {
          activity: {
            type: 'mileage',
            distance_unit: 'kilometers',
            distance_value: parseFloat(transportation)
          }
        }
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${carbonInterfaceApiKey}`
      }
    }
  );

  const transportationCarbonFootprint = response.data.data.attributes.carbon_g;

  // Calculate the total carbon footprint based on the transportation, energy, and waste inputs
  const totalCarbonFootprint = parseFloat(transportationCarbonFootprint) + parseFloat(energy) + parseFloat(waste);

  // Save the carbon footprint to a database
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();

  const insertQuery = 'INSERT INTO carbon_footprints (transportation, energy, waste, total) VALUES ($1, $2, $3, $4)';
  const insertValues = [transportation, energy, waste, totalCarbonFootprint];

  await client.query(insertQuery, insertValues);

  await client.end();

  res.json({
    carbonFootprint: totalCarbonFootprint
  });
});

app.get('/carbon-footprints', async (req, res) => {
  // Retrieve all saved carbon footprints from the database
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();

  const selectQuery = 'SELECT * FROM carbon_footprints';

  const result = await client.query(selectQuery);

  await client.end();

  res.json(result.rows);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
