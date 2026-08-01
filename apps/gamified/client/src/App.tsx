import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import './App.css';
import type { User } from '@shared/api/models/user.model';
import { userApi } from '@shared/api/services/users.api';
import { authApi } from '@shared/api/services/auth.api';
import { Icon } from '@shared/ui/Icon';

function App() {
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState<User[] | null>([]);

  const fetchAPI = async () => {
    // GET /users requires a Supabase session; the demo list only renders once logged in.
    const session = await authApi.getSession();
    if (!session) {
      setUsers(null);
      return;
    }

    let response = null;
    try {
      response = await userApi.getUsers(session.access_token);
    } catch (error) {
      console.error("Error getting users:", error);
    } finally {
      setUsers(response);
    }
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  return (
    <>
      <section id="center">
        <div className="hero">
          <img
            src={heroImg}
            className="base"
            width="170"
            height="179"
            alt=""
          />
          <img
            src={reactLogo}
            className="framework"
            alt="React logo"
          />
          <img
            src={viteLogo}
            className="vite"
            alt="Vite logo"
          />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        {users?.map((user) => (
          <div key={user.id}>
            <p>{user.firstName} {user.lastName}</p>
            <br></br>
          </div>
        ))}
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <Icon
            name="BookOpen"
            className="icon"
            role="presentation"
            aria-hidden="true"
          />
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img
                  className="logo"
                  src={viteLogo}
                  alt=""
                />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img
                  className="button-icon"
                  src={reactLogo}
                  alt=""
                />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <Icon
            name="Users"
            className="icon"
            role="presentation"
            aria-hidden="true"
          />
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <Icon
                  name="GithubLogo"
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                />
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <Icon
                  name="DiscordLogo"
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                />
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <Icon
                  name="XLogo"
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                />
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <Icon
                  name="Butterfly"
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                />
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;
