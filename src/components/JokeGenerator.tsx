import React, { useState } from 'react';
import '../styles/JokeGenerator.css';

interface Joke {
  setup: string;
  delivery: string;
  type: string;
}

interface JokeResponse {
  joke?: string;
  setup?: string;
  delivery?: string;
  type?: string;
  error?: boolean;
  message?: string;
}

const JokeGenerator: React.FC = () => {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [jokeHistory, setJokeHistory] = useState<string[]>([]);

  const fetchJoke = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');

      if (!response.ok) {
        throw new Error('Failed to fetch joke');
      }

      const data: JokeResponse = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Error fetching joke');
      }

      const newJoke: Joke = {
        setup: data.setup || '',
        delivery: data.delivery || '',
        type: data.type || '',
      };

      setJoke(newJoke);

      // Add to history
      const jokeText = `${newJoke.setup} ${newJoke.delivery}`;
      setJokeHistory((prev) => [jokeText, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching the joke');
      setJoke(null);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setJokeHistory([]);
  };

  return (
    <div className="joke-generator-container">
      <div className="joke-main">
        <div className="joke-header">
          <h1>😂 Random Joke Generator</h1>
          <p>Get a laugh with our API-powered joke generator!</p>
        </div>

        <button
          onClick={fetchJoke}
          disabled={loading}
          className="fetch-button"
        >
          {loading ? 'Loading...' : '🎭 Get a Joke'}
        </button>

        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
          </div>
        )}

        {joke && (
          <div className="joke-card">
            <div className="joke-type-badge">{joke.type}</div>
            <div className="joke-setup">{joke.setup}</div>
            <div className="joke-divider"></div>
            <div className="joke-delivery">{joke.delivery}</div>
          </div>
        )}

        {!joke && !error && !loading && (
          <div className="placeholder-card">
            <p>Click the button to get started! 👉</p>
          </div>
        )}
      </div>

      <div className="joke-history-section">
        <div className="history-header">
          <h2>📜 Joke History</h2>
          {jokeHistory.length > 0 && (
            <button onClick={clearHistory} className="clear-button">
              Clear
            </button>
          )}
        </div>

        {jokeHistory.length === 0 ? (
          <p className="no-history">No jokes yet. Start laughing!</p>
        ) : (
          <ul className="history-list">
            {jokeHistory.map((j, index) => (
              <li key={index} className="history-item">
                <span className="history-number">{index + 1}.</span>
                <span className="history-text">{j}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default JokeGenerator;
