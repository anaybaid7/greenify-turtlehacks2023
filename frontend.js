import React, { useState, useEffect } from 'react';
import { calculateCarbonFootprint, getRecommendations } from './api';
import { useAuth } from './auth';

function App() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    transportation: '',
    energy: '',
    waste: ''
  });
  const [carbonFootprint, setCarbonFootprint] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function fetchRecommendations() {
      if (carbonFootprint) {
        const response = await getRecommendations(carbonFootprint);
        setRecommendations(response.data);
      }
    }
    fetchRecommendations();
  }, [carbonFootprint]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await calculateCarbonFootprint(form);
    setCarbonFootprint(response.data.carbonFootprint);
  };

  return (
    <div className="App">
      <h1>Greenify</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.name}!</h2>
          <p>Your email address is: {user.email}</p>
        </div>
      ) : (
        <p>Please log in to save your carbon footprint data.</p>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Transportation:
          <input type="text" name="transportation" value={form.transportation} onChange={handleFormChange} />
        </label>
        <label>
          Energy:
          <input type="text" name="energy" value={form.energy} onChange={handleFormChange} />
        </label>
        <label>
          Waste:
          <input type="text" name="waste" value={form.waste} onChange={handleFormChange} />
        </label>
        <button type="submit">Calculate</button>
      </form>
      {carbonFootprint && (
        <div>
          <h2>Your carbon footprint is {carbonFootprint} kg CO2e</h2>
          {recommendations.length > 0 && (
            <div>
              <h3>Here are some recommendations to reduce your carbon footprint:</h3>
              <ul>
                {recommendations.map((recommendation) => (
                  <li key={recommendation.id}>{recommendation.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <button>Log in</button>
      <button>Sign up</button>
    </div>
  );
}

export default App;
