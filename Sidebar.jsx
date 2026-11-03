import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShoppingBag,
  BrainCircuit,
  Lightbulb,
  FileText,
  Database,
  Settings,
  CircleHelp,
  LogOut,
  Sparkles,
  X,
  Check,
  User,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";


// ============================================================
// MENU
// ============================================================

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Sales Analytics",
    path: "/sales",
    icon: BarChart3,
  },
  {
    name: "Customer Analytics",
    path: "/customers",
    icon: Users,
  },
  {
    name: "Product Analytics",
    path: "/products",
    icon: ShoppingBag,
  },
  {
    name: "Region Analytics",
    path: "/regions",
    icon: BarChart3,
  },
  {
    name: "AI Predictions",
    path: "/ai-predictions",
    icon: BrainCircuit,
  },
  {
    name: "Business Insights",
    path: "/insights",
    icon: Lightbulb,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    name: "Data Management",
    path: "/data",
    icon: Database,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    name: "Help & Support",
    path: "/help",
    icon: CircleHelp,
  },
];


// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar() {

  const navigate = useNavigate();

  const [showUpgrade, setShowUpgrade] = useState(false);

  const [showLogout, setShowLogout] = useState(false);

  const [showProfile, setShowProfile] = useState(false);


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    // Remove login session
    localStorage.removeItem("ai_bi_logged_in");

    // Remove optional user/session information
    localStorage.removeItem("ai_bi_user");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");

    // Close popup
    setShowLogout(false);

    // Send user to login page
    navigate("/login", {
      replace: true,
    });
  };


  // ==========================================================
  // PROFILE
  // ==========================================================

  const handleProfile = () => {

    setShowProfile(false);

    navigate("/settings");
  };


  return (
    <>
      <aside className="sidebar">

        {/* ====================================================
            LOGO
        ==================================================== */}

        <div className="sidebar-top">

          <div className="brand">

            <div className="brand-icon">
              <BarChart3 size={25} />
            </div>

            <div>
              <h2>AI BI Dashboard</h2>
              <span>Business Intelligence</span>
            </div>

          </div>


          {/* ==================================================
              MENU
          ================================================== */}

          <nav className="sidebar-menu">

            {menuItems.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive ? "active" : ""
                    }`
                  }
                >

                  <Icon size={19} />

                  <span>
                    {item.name}
                  </span>

                </NavLink>
              );

            })}

          </nav>

        </div>


        {/* ====================================================
            BOTTOM
        ==================================================== */}

        <div className="sidebar-bottom">


          {/* ==================================================
              UPGRADE CARD
          ================================================== */}

          <div className="upgrade-card">

            <div className="upgrade-icon">
              <Sparkles size={22} />
            </div>

            <h3>
              Upgrade to Pro
            </h3>

            <p>
              Unlock advanced analytics,
              AI insights and unlimited
              report downloads.
            </p>

            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
            >
              Upgrade Now
            </button>

          </div>


          {/* ==================================================
              USER CARD
          ================================================== */}

          <button
            type="button"
            className="user-card"
            onClick={() =>
              setShowProfile(!showProfile)
            }
          >

            <div className="user-avatar">
              A
            </div>


            <div className="user-info">

              <strong>
                Admin User
              </strong>

              <span>
                administrator
              </span>

              <small>
                <i></i>
                Online
              </small>

            </div>

          </button>


          {/* ==================================================
              PROFILE MENU
          ================================================== */}

          {showProfile && (

            <div className="profile-menu">

              <div className="profile-menu-header">

                <div className="profile-menu-avatar">
                  A
                </div>

                <div>

                  <strong>
                    Admin User
                  </strong>

                  <span>
                    administrator
                  </span>

                </div>

              </div>


              <button
                type="button"
                onClick={handleProfile}
              >
                <User size={16} />

                <span>
                  Account Settings
                </span>

              </button>


              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  setShowLogout(true);
                }}
              >
                <LogOut size={16} />

                <span>
                  Logout
                </span>

              </button>

            </div>

          )}


          {/* ==================================================
              LOGOUT BUTTON
          ================================================== */}

          <button
            type="button"
            className="logout-btn"
            onClick={() => setShowLogout(true)}
          >

            <LogOut size={18} />

            Logout

          </button>


        </div>

      </aside>


      {/* ======================================================
          UPGRADE MODAL
      ====================================================== */}

      {showUpgrade && (

        <div
          className="upgrade-modal-overlay"
          onClick={() => setShowUpgrade(false)}
        >

          <div
            className="upgrade-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="upgrade-modal-close"
              onClick={() =>
                setShowUpgrade(false)
              }
            >
              <X size={20} />
            </button>


            <div className="upgrade-modal-icon">
              <Sparkles size={30} />
            </div>


            <h2>
              Upgrade to Pro
            </h2>


            <p className="upgrade-modal-subtitle">
              Unlock the full power of your
              AI BI Dashboard.
            </p>


            <div className="upgrade-features">

              <div className="upgrade-feature">
                <Check size={17} />
                <span>
                  Advanced analytics
                </span>
              </div>

              <div className="upgrade-feature">
                <Check size={17} />
                <span>
                  AI-powered business insights
                </span>
              </div>

              <div className="upgrade-feature">
                <Check size={17} />
                <span>
                  Advanced AI predictions
                </span>
              </div>

              <div className="upgrade-feature">
                <Check size={17} />
                <span>
                  Unlimited report downloads
                </span>
              </div>

              <div className="upgrade-feature">
                <Check size={17} />
                <span>
                  Premium dashboard features
                </span>
              </div>

            </div>


            <div className="upgrade-price">

              <strong>
                Pro
              </strong>

              <span>
                Premium Plan
              </span>

            </div>


            <button
              type="button"
              className="upgrade-confirm-btn"
              onClick={() => {

                alert(
                  "Pro upgrade is coming soon. Payment integration will be available here."
                );

              }}
            >

              <Sparkles size={17} />

              Upgrade to Pro

            </button>


            <button
              type="button"
              className="upgrade-cancel-btn"
              onClick={() =>
                setShowUpgrade(false)
              }
            >
              Maybe Later
            </button>

          </div>

        </div>

      )}


      {/* ======================================================
          LOGOUT CONFIRMATION
      ====================================================== */}

      {showLogout && (

        <div
          className="logout-modal-overlay"
          onClick={() =>
            setShowLogout(false)
          }
        >

          <div
            className="logout-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="logout-modal-icon">
              <LogOut size={25} />
            </div>


            <h2>
              Logout?
            </h2>


            <p>
              Are you sure you want to
              logout from your account?
            </p>


            <div className="logout-modal-actions">

              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() =>
                  setShowLogout(false)
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="logout-confirm-btn"
                onClick={handleLogout}
              >
                <LogOut size={16} />

                Logout
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}