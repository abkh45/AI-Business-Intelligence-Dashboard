import {
  CalendarDays,
  ChevronDown,
  Search,
  Bell,
  User,
  X,
  Settings,
  LogOut,
  UserCircle,
  Check,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";


// ============================================================
// YEARS
// ============================================================

const years = [
  "2022",
  "2023",
  "2024",
  "2025",
];


// ============================================================
// SEARCH ITEMS
// ============================================================

const searchItems = [
  {
    label: "Dashboard",
    path: "/",
    keywords: "dashboard home overview",
  },
  {
    label: "Sales Analytics",
    path: "/sales",
    keywords: "sales revenue analytics",
  },
  {
    label: "Customer Analytics",
    path: "/customers",
    keywords: "customers customer analytics",
  },
  {
    label: "Product Analytics",
    path: "/products",
    keywords: "products product analytics",
  },
  {
    label: "Region Analytics",
    path: "/regions",
    keywords: "region regions geography location",
  },
  {
    label: "AI Predictions",
    path: "/ai-predictions",
    keywords: "ai predictions forecast prediction",
  },
  {
    label: "Business Insights",
    path: "/insights",
    keywords: "business insights intelligence",
  },
  {
    label: "Reports",
    path: "/reports",
    keywords: "reports report",
  },
  {
    label: "Data Management",
    path: "/data",
    keywords: "data dataset csv upload",
  },
  {
    label: "Settings",
    path: "/settings",
    keywords: "settings configuration account",
  },
  {
    label: "Help & Support",
    path: "/help",
    keywords: "help support assistance",
  },
];


// ============================================================
// NOTIFICATIONS
// ============================================================

const initialNotifications = [
  {
    id: 1,
    title: "Dashboard updated",
    message: "Your dashboard data has been refreshed.",
    time: "Just now",
    unread: true,
  },
  {
    id: 2,
    title: "Dataset ready",
    message: "The selected year's dataset is available.",
    time: "5 min ago",
    unread: true,
  },
  {
    id: 3,
    title: "Sales insight",
    message: "New sales performance insights are available.",
    time: "15 min ago",
    unread: true,
  },
  {
    id: 4,
    title: "Report available",
    message: "Your latest business report is ready.",
    time: "30 min ago",
    unread: true,
  },
  {
    id: 5,
    title: "System notification",
    message: "AI BI Dashboard is running normally.",
    time: "1 hour ago",
    unread: true,
  },
];


// ============================================================
// NAVBAR
// ============================================================

export default function Navbar({
  selectedYear,
  onYearChange,
}) {

  // ==========================================================
  // REACT ROUTER
  // ==========================================================

  const navigate = useNavigate();


  // ==========================================================
  // YEAR DROPDOWN
  // ==========================================================

  const [
    showYearDropdown,
    setShowYearDropdown,
  ] = useState(false);


  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    showSearchResults,
    setShowSearchResults,
  ] = useState(false);


  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState(initialNotifications);


  // ==========================================================
  // PROFILE
  // ==========================================================

  const [
    showProfile,
    setShowProfile,
  ] = useState(false);


  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);


  // ==========================================================
  // REF
  // ==========================================================

  const navbarRef = useRef(null);


  // ==========================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(() => {

    function handleOutsideClick(event) {

      if (
        navbarRef.current &&
        !navbarRef.current.contains(
          event.target
        )
      ) {

        setShowYearDropdown(false);
        setShowNotifications(false);
        setShowProfile(false);
        setShowSearchResults(false);

      }
    }


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);


  // ==========================================================
  // YEAR SELECT
  // ==========================================================

  function selectYear(year) {

    onYearChange(year);

    setShowYearDropdown(false);

    setShowNotifications(false);
    setShowProfile(false);
    setShowSearchResults(false);
  }


  // ==========================================================
  // SEARCH
  // ==========================================================

  function handleSearch(event) {

    const value =
      event.target.value;

    setSearchValue(value);

    setShowSearchResults(
      value.trim().length > 0
    );

    setShowNotifications(false);
    setShowProfile(false);
    setShowYearDropdown(false);
  }


  // ==========================================================
  // FILTER SEARCH RESULTS
  // ==========================================================

  const filteredSearchItems =
    searchItems.filter((item) => {

      const searchText =
        searchValue
          .trim()
          .toLowerCase();

      if (!searchText) {
        return false;
      }

      return (
        item.label
          .toLowerCase()
          .includes(searchText) ||

        item.keywords
          .toLowerCase()
          .includes(searchText)
      );

    });


  // ==========================================================
  // SELECT SEARCH RESULT
  // ==========================================================

  function selectSearchResult(item) {

    console.log(
      "Search selected:",
      item.label
    );

    console.log(
      "Navigating to:",
      item.path
    );


    // Clear search
    setSearchValue("");

    // Close search
    setShowSearchResults(false);


    // Close other dropdowns
    setShowYearDropdown(false);
    setShowNotifications(false);
    setShowProfile(false);


    // IMPORTANT:
    // Actually navigate using React Router
    navigate(item.path);
  }


  // ==========================================================
  // SEARCH ENTER KEY
  // ==========================================================

  function handleSearchKeyDown(event) {

    if (event.key === "Enter") {

      event.preventDefault();


      const firstResult =
        filteredSearchItems[0];


      if (firstResult) {

        selectSearchResult(
          firstResult
        );

      }

    }


    if (event.key === "Escape") {

      setShowSearchResults(false);

    }

  }


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  function clearSearch() {

    setSearchValue("");

    setShowSearchResults(false);

  }


  // ==========================================================
  // NOTIFICATION COUNT
  // ==========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.unread
    ).length;


  // ==========================================================
  // TOGGLE NOTIFICATIONS
  // ==========================================================

  function toggleNotifications() {

    setShowNotifications(
      (previous) =>
        !previous
    );

    setShowYearDropdown(false);
    setShowProfile(false);
    setShowSearchResults(false);
  }


  // ==========================================================
  // MARK NOTIFICATIONS READ
  // ==========================================================

  function markNotificationsRead() {

    setNotifications(
      (previous) =>
        previous.map(
          (notification) => ({
            ...notification,
            unread: false,
          })
        )
    );

  }


  // ==========================================================
  // TOGGLE PROFILE
  // ==========================================================

  function toggleProfile() {

    setShowProfile(
      (previous) =>
        !previous
    );

    setShowNotifications(false);
    setShowYearDropdown(false);
    setShowSearchResults(false);
  }


  // ==========================================================
  // PROFILE
  // ==========================================================

  function openProfile() {

    setShowProfile(false);

    /*
      There is no /profile route in your App.jsx.

      Therefore we open Settings for the Admin profile
      until you create a separate Profile page.
    */

    navigate("/settings");

  }


  // ==========================================================
  // SETTINGS
  // ==========================================================

  function openSettings() {

    setShowProfile(false);

    navigate("/settings");

  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {

    setShowProfile(false);


    const confirmed =
      window.confirm(
        "Are you sure you want to logout?"
      );


    if (!confirmed) {
      return;
    }


    console.log(
      "Logging out..."
    );


    // Remove login state
    localStorage.removeItem(
      "ai_bi_logged_in"
    );


    // Go to login page
    navigate(
      "/login",
      {
        replace: true,
      }
    );

  }


  // ==========================================================
  // SIDEBAR TOGGLE
  // ==========================================================

  function toggleSidebar() {

    const newState =
      !sidebarCollapsed;


    setSidebarCollapsed(
      newState
    );


    window.dispatchEvent(
      new CustomEvent(
        "sidebarToggle",
        {
          detail: {
            collapsed:
              newState,
          },
        }
      )
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <header
      className="navbar"
      ref={navbarRef}
    >

      {/* ======================================================
          LEFT
      ====================================================== */}

      <div className="navbar-left">

        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
          onClick={
            toggleSidebar
          }
        >
          ☰
        </button>

      </div>


      {/* ======================================================
          RIGHT
      ====================================================== */}

      <div className="navbar-right">


        {/* ====================================================
            YEAR SELECTOR
        ==================================================== */}

        <div className="year-selector-wrapper">

          <button
            type="button"
            className={`year-selector ${
              showYearDropdown
                ? "year-selector-open"
                : ""
            }`}
            onClick={() => {

              setShowYearDropdown(
                (previous) =>
                  !previous
              );

              setShowNotifications(false);
              setShowProfile(false);
              setShowSearchResults(false);

            }}
          >

            <CalendarDays
              size={15}
            />

            <span>
              {selectedYear}
            </span>

            <ChevronDown
              size={14}
              className={
                showYearDropdown
                  ? "year-chevron rotated"
                  : "year-chevron"
              }
            />

          </button>


          {/* YEAR DROPDOWN */}

          {showYearDropdown && (

            <div className="year-dropdown">

              {years.map(
                (year) => (

                  <button
                    key={year}
                    type="button"
                    className={`year-option ${
                      selectedYear ===
                      year
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectYear(
                        year
                      )
                    }
                  >

                    {year}

                  </button>

                )
              )}

            </div>

          )}

        </div>


        {/* ====================================================
            SEARCH
        ==================================================== */}

        <div
          className={`navbar-search ${
            showSearchResults
              ? "navbar-search-open"
              : ""
          }`}
        >

          <Search
            size={15}
          />


          <input
            type="text"
            placeholder="Search anything..."
            value={searchValue}

            onFocus={() => {

              if (
                searchValue
                  .trim()
                  .length > 0
              ) {

                setShowSearchResults(
                  true
                );

              }

              setShowNotifications(false);
              setShowProfile(false);
              setShowYearDropdown(false);

            }}

            onChange={
              handleSearch
            }

            onKeyDown={
              handleSearchKeyDown
            }
          />


          {/* CLEAR BUTTON */}

          {searchValue && (

            <button
              type="button"
              className="search-clear-btn"
              onClick={
                clearSearch
              }
              aria-label="Clear search"
            >

              <X size={13} />

            </button>

          )}


          {/* SEARCH RESULTS */}

          {showSearchResults && (

            <div className="search-results">

              {filteredSearchItems.length >
              0 ? (

                <>

                  <div className="search-results-title">
                    Search results
                  </div>


                  {filteredSearchItems.map(
                    (item) => (

                      <button
                        key={
                          item.label
                        }
                        type="button"
                        className="search-result-item"

                        onClick={() =>
                          selectSearchResult(
                            item
                          )
                        }
                      >

                        <Search
                          size={14}
                        />

                        <span>
                          {item.label}
                        </span>

                      </button>

                    )
                  )}

                </>

              ) : (

                <div className="search-no-results">

                  No results found

                </div>

              )}

            </div>

          )}

        </div>


        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <div className="notification-wrapper">

          <button
            type="button"
            className={`notification-btn ${
              showNotifications
                ? "notification-btn-active"
                : ""
            }`}
            onClick={
              toggleNotifications
            }
            aria-label="Notifications"
            aria-expanded={
              showNotifications
            }
          >

            <Bell
              size={17}
            />


            {unreadCount > 0 && (

              <span className="notification-badge">
                {unreadCount}
              </span>

            )}

          </button>


          {/* NOTIFICATION DROPDOWN */}

          {showNotifications && (

            <div className="notification-dropdown">

              <div className="notification-header">

                <strong>
                  Notifications
                </strong>


                {unreadCount > 0 && (

                  <button
                    type="button"
                    className="mark-read-btn"
                    onClick={
                      markNotificationsRead
                    }
                  >

                    <Check
                      size={12}
                    />

                    Mark all read

                  </button>

                )}

              </div>


              <div className="notification-list">

                {notifications.map(
                  (notification) => (

                    <div
                      key={
                        notification.id
                      }
                      className={`notification-item ${
                        notification.unread
                          ? "unread"
                          : ""
                      }`}
                    >

                      <div className="notification-dot">
                        {notification.unread
                          ? ""
                          : null}
                      </div>


                      <div className="notification-content">

                        <strong>
                          {
                            notification.title
                          }
                        </strong>


                        <p>
                          {
                            notification.message
                          }
                        </p>


                        <small>
                          {
                            notification.time
                          }
                        </small>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            PROFILE
        ==================================================== */}

        <div className="profile-wrapper">

          <button
            type="button"
            className={`navbar-profile ${
              showProfile
                ? "navbar-profile-active"
                : ""
            }`}
            aria-label="Profile"
            aria-expanded={
              showProfile
            }
            onClick={
              toggleProfile
            }
          >

            <User
              size={16}
            />

          </button>


          {/* PROFILE DROPDOWN */}

          {showProfile && (

            <div className="profile-dropdown">


              {/* PROFILE HEADER */}

              <div className="profile-dropdown-header">

                <div className="profile-avatar-large">

                  <User
                    size={20}
                  />

                </div>


                <div>

                  <strong>
                    Admin User
                  </strong>

                  <span>
                    Administrator
                  </span>

                  <small>
                    ● Online
                  </small>

                </div>

              </div>


              <div className="profile-divider" />


              {/* PROFILE */}

              <button
                type="button"
                className="profile-menu-item"
                onClick={
                  openProfile
                }
              >

                <UserCircle
                  size={16}
                />

                <span>
                  Profile
                </span>

              </button>


              {/* SETTINGS */}

              <button
                type="button"
                className="profile-menu-item"
                onClick={
                  openSettings
                }
              >

                <Settings
                  size={16}
                />

                <span>
                  Settings
                </span>

              </button>


              <div className="profile-divider" />


              {/* LOGOUT */}

              <button
                type="button"
                className="profile-menu-item logout-item"
                onClick={
                  logout
                }
              >

                <LogOut
                  size={16}
                />

                <span>
                  Logout
                </span>

              </button>


            </div>

          )}

        </div>

      </div>

    </header>

  );
}