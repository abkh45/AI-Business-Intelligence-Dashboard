import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Brain,
} from "lucide-react";


export default function Register() {

  const navigate = useNavigate();


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");


  const [error, setError] = useState("");


  function handleRegister(event) {

    event.preventDefault();

    setError("");


    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      password.length < 6
    ) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    if (
      password !== confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    // ==================================================
    // CHECK EXISTING ACCOUNT
    // ==================================================

    const existingUser =
      localStorage.getItem(
        "ai_bi_user"
      );


    if (existingUser) {

      const user =
        JSON.parse(existingUser);


      if (
        user.email.toLowerCase() ===
        email.trim().toLowerCase()
      ) {

        setError(
          "An account with this email already exists."
        );

        return;
      }

    }


    // ==================================================
    // CREATE USER
    // ==================================================

    const newUser = {

      name:
        name.trim(),

      email:
        email.trim().toLowerCase(),

      password,

      role:
        "Administrator",

      currency:
        "INR",

      theme:
        "Dark",

    };


    localStorage.setItem(
      "ai_bi_user",
      JSON.stringify(newUser)
    );


    // ==================================================
    // LOGIN USER AUTOMATICALLY
    // ==================================================

    localStorage.setItem(
      "ai_bi_logged_in",
      "true"
    );


    // ==================================================
    // OPEN DASHBOARD
    // ==================================================

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
          Create Account
        </h2>

        <p className="auth-description">
          Create your dashboard account
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
          onSubmit={handleRegister}
        >

          {/* NAME */}

          <div className="auth-field">

            <label>
              Full Name
            </label>

            <div className="auth-input-wrapper">

              <User size={18} />

              <input
                type="text"
                placeholder="Admin User"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />

            </div>

          </div>


          {/* EMAIL */}

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


          {/* PASSWORD */}

          <div className="auth-field">

            <label>
              Password
            </label>

            <div className="auth-input-wrapper">

              <Lock size={18} />

              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="auth-field">

            <label>
              Confirm Password
            </label>

            <div className="auth-input-wrapper">

              <Lock size={18} />

              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                required
              />

            </div>

          </div>


          <button
            type="submit"
            className="auth-button"
          >

            <UserPlus size={18} />

            Create Account

          </button>

        </form>


        {/* ==================================================
            LOGIN
        ================================================== */}

        <div className="auth-footer">

          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Login
          </Link>

        </div>

      </div>

    </div>

  );

}