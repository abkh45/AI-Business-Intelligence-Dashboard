import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  User,
  Mail,
  Shield,
  Globe,
  Palette,
  Save,
  RotateCcw,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";


export default function Settings() {

  const navigate = useNavigate();


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [role, setRole] =
    useState("Administrator");

  const [currency, setCurrency] =
    useState("INR");

  const [theme, setTheme] =
    useState("Dark");


  const [message, setMessage] =
    useState("");


  // ============================================================
  // LOAD USER
  // ============================================================

  useEffect(() => {

    const savedUser =
      localStorage.getItem(
        "ai_bi_user"
      );


    if (!savedUser) {

      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }


    const user =
      JSON.parse(savedUser);


    setName(
      user.name || ""
    );

    setEmail(
      user.email || ""
    );

    setRole(
      user.role ||
      "Administrator"
    );

    setCurrency(
      user.currency ||
      "INR"
    );

    setTheme(
      user.theme ||
      "Dark"
    );

  }, [navigate]);


  // ============================================================
  // SAVE PROFILE
  // ============================================================

  function handleSave(event) {

    event.preventDefault();


    const savedUser =
      localStorage.getItem(
        "ai_bi_user"
      );


    if (!savedUser) {
      return;
    }


    const oldUser =
      JSON.parse(savedUser);


    const updatedUser = {

      ...oldUser,

      name:
        name.trim(),

      email:
        email.trim(),

      role,

      currency,

      theme,

    };


    localStorage.setItem(
      "ai_bi_user",
      JSON.stringify(updatedUser)
    );


    setMessage(
      "Profile saved successfully."
    );


    // Tell Sidebar/Navbar to update

    window.dispatchEvent(
      new Event("userUpdated")
    );


    setTimeout(() => {

      setMessage("");

    }, 3000);

  }


  // ============================================================
  // RESET FORM
  // ============================================================

  function handleReset() {

    const savedUser =
      localStorage.getItem(
        "ai_bi_user"
      );


    if (!savedUser) {
      return;
    }


    const user =
      JSON.parse(savedUser);


    setName(
      user.name || ""
    );

    setEmail(
      user.email || ""
    );

    setRole(
      user.role ||
      "Administrator"
    );

    setCurrency(
      user.currency ||
      "INR"
    );

    setTheme(
      user.theme ||
      "Dark"
    );


    setMessage("");

  }


  // ============================================================
  // LOGOUT
  // ============================================================

  function handleLogout() {

    localStorage.removeItem(
      "ai_bi_logged_in"
    );


    navigate(
      "/login",
      {
        replace: true,
      }
    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="dashboard">

      <Sidebar />


      <main className="main-content">

        <Navbar />


        <h1
          style={{
            color: "white",
            marginBottom: "5px",
          }}
        >
          My Account
        </h1>


        <p
          style={{
            color: "#7890b0",
            marginBottom: "20px",
          }}
        >
          Manage your profile and account preferences.
        </p>


        {/* ==================================================
            PROFILE HEADER
        ================================================== */}

        <div className="chart-card">

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >

            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#7c4dff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "22px",
                fontWeight: "700",
              }}
            >
              {(
                name || "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>


            <div>

              <h2
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "18px",
                }}
              >
                {name || "Admin User"}
              </h2>


              <p
                style={{
                  margin: "4px 0",
                  color: "#7890b0",
                }}
              >
                {email}
              </p>


              <span
                style={{
                  color: "#8b5cf6",
                  fontSize: "12px",
                }}
              >
                ● {role}
              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            ACCOUNT FORM
        ================================================== */}

        <div
          className="chart-card"
          style={{
            marginTop: "15px",
          }}
        >

          <div className="card-header">

            <h3>
              Account Information
            </h3>

          </div>


          <form
            onSubmit={handleSave}
          >

            {/* NAME */}

            <div className="setting-item">

              <label>
                Full Name
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <User
                  size={17}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color: "#7890b0",
                  }}
                />

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  style={{
                    paddingLeft: "38px",
                  }}
                  required
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className="setting-item">

              <label>
                Email
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <Mail
                  size={17}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color: "#7890b0",
                  }}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  style={{
                    paddingLeft: "38px",
                  }}
                  required
                />

              </div>

            </div>


            {/* ROLE */}

            <div className="setting-item">

              <label>
                Role
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <Shield
                  size={17}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color: "#7890b0",
                  }}
                />

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value
                    )
                  }
                  style={{
                    paddingLeft: "38px",
                  }}
                >

                  <option>
                    Administrator
                  </option>

                  <option>
                    Manager
                  </option>

                  <option>
                    Analyst
                  </option>

                  <option>
                    Viewer
                  </option>

                </select>

              </div>

            </div>


            {/* CURRENCY */}

            <div className="setting-item">

              <label>
                Currency
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <Globe
                  size={17}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color: "#7890b0",
                  }}
                />

                <select
                  value={currency}
                  onChange={(event) =>
                    setCurrency(
                      event.target.value
                    )
                  }
                  style={{
                    paddingLeft: "38px",
                  }}
                >

                  <option value="INR">
                    INR - Indian Rupee
                  </option>

                  <option value="USD">
                    USD - US Dollar
                  </option>

                  <option value="EUR">
                    EUR - Euro
                  </option>

                </select>

              </div>

            </div>


            {/* THEME */}

            <div className="setting-item">

              <label>
                Theme
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <Palette
                  size={17}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color: "#7890b0",
                  }}
                />

                <select
                  value={theme}
                  onChange={(event) =>
                    setTheme(
                      event.target.value
                    )
                  }
                  style={{
                    paddingLeft: "38px",
                  }}
                >

                  <option>
                    Dark
                  </option>

                  <option>
                    Light
                  </option>

                </select>

              </div>

            </div>


            {/* SUCCESS MESSAGE */}

            {message && (

              <div
                style={{
                  marginTop: "15px",
                  color: "#22c55e",
                  fontSize: "13px",
                }}
              >
                ✓ {message}
              </div>

            )}


            {/* BUTTONS */}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                flexWrap: "wrap",
              }}
            >

              <button
                type="submit"
                className="save-btn"
              >

                <Save size={16} />

                Save Profile

              </button>


              <button
                type="button"
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 16px",
                  borderRadius: "7px",
                  border:
                    "1px solid #33445f",
                  background:
                    "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >

                <RotateCcw size={15} />

                Reset

              </button>


              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 16px",
                  borderRadius: "7px",
                  border:
                    "1px solid #ef4444",
                  background:
                    "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >

                <LogOut size={15} />

                Logout

              </button>

            </div>

          </form>

        </div>

      </main>

    </div>

  );

}