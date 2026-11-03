import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Brain } from "lucide-react";


export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");


  function handleLogin(event) {

    event.preventDefault();

    setError("");


    const savedUser = localStorage.getItem(
      "ai_bi_user"
    );


    if (!savedUser) {

      setError(
        "No account found. Please create an account first."
      );

      return;
    }


    const user = JSON.parse(savedUser);


    if (
      user.email !== email.trim()
    ) {

      setError(
        "Email address is incorrect."
      );

      return;
    }


    if (
      user.password !== password
    ) {

      setError(
        "Password is incorrect."
      );

      return;
    }


    // Save login state

    localStorage.setItem(
      "ai_bi_logged_in",
      "true"
    );


    // Go to dashboard

    navigate("/", {
      replace: true,
    });

  }


  return (

    <div className="auth-page">

      <div className="auth-card">

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="auth-logo">

          <div className="auth-logo-icon">
            <Brain size={30} />
          </div>

          <div>

            <h1>
              AI BI Dashboard
            </h1>

            <p>
              Business Intelligence
            </p>

          </div>

        </div>


        {/* ==================================================
            TITLE
        ================================================== */}

        <h2>
          Welcome Back
        </h2>

        <p className="auth-description">
          Login to your AI BI Dashboard
        </p>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleLogin}
        >

          <div className="auth-field">

            <label>
              Email
            </label>

            <div className="auth-input-wrapper">

              <Mail size={18} />

              <input
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>

          </div>


          <div className="auth-field">

            <label>
              Password
            </label>

            <div className="auth-input-wrapper">

              <Lock size={18} />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>

          </div>


          <button
            type="submit"
            className="auth-button"
          >

            <LogIn size={18} />

            Login

          </button>

        </form>


        {/* ==================================================
            REGISTER
        ================================================== */}

        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create Account
          </Link>

        </div>

      </div>

    </div>

  );

}