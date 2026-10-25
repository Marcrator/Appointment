
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const read = (key, fallback = []) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const notify = message => alert(message);

  // ===== INITIAL DATA =====
  if (!localStorage.getItem("users")) {
    save("users", [{
      name: "Samantha Reyes",
      email: "samantha@student.com",
      password: "password123"
    }]);
  }

  if (!localStorage.getItem("appointments")) {
    save("appointments", [
      {
        id: 1,
        date: "2026-09-18",
        time: "09:00",
        service: "Consultation",
        status: "Confirmed",
        owner: "Samantha Reyes"
      },
      {
        id: 2,
        date: "2026-09-19",
        time: "13:30",
        service: "Follow-up",
        status: "Pending",
        owner: "Samantha Reyes"
      }
    ]);
  }

  const loginForm = $("#loginForm");
  const signupForm = $("#signupForm");
  const loginError = $("#loginError");
  const signupError = $("#signupError");
  const authSwitcher = $("#authSwitcher");
  const pageContent = $("#pageContent");

  let calendarDate = new Date();
  let currentPage = "dashboard";

  // ===== SESSION =====
  const currentUser = () => localStorage.getItem("currentUser") || "";

  const isLoggedIn = () =>
    localStorage.getItem("isLoggedIn") === "true" &&
    currentUser() !== "";

  const getUser = () =>
    read("users", []).find(user => user.name === currentUser());

  function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
  }

  function hideError(element) {
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
  }

  // ===== AUTHENTICATION VIEW CONTROL =====
  function switchAuthView(target) {
    // Never allow the auth switcher to open the dashboard.
    if (target !== "login" && target !== "signup") {
      target = "login";
    }

    document.body.classList.remove("dashboard-mode");

    $$(".view-screen").forEach(screen => {
      screen.classList.toggle("active", screen.id === `${target}-view`);
    });

    if (authSwitcher) authSwitcher.style.display = "flex";

    $$(".switcher-btn").forEach(button => {
      button.classList.toggle("active", button.dataset.target === target);
    });
  }

  function showDashboard() {
    if (!isLoggedIn()) {
      switchAuthView("login");
      return;
    }

    document.body.classList.add("dashboard-mode");

    $$(".view-screen").forEach(screen => {
      screen.classList.toggle("active", screen.id === "dashboard-view");
    });

    // Hide Login and Sign Up navigation completely.
    if (authSwitcher) authSwitcher.style.display = "none";

    updateProfile();
    renderPage("dashboard");
  }

  $$(".switcher-btn").forEach(button => {
    button.addEventListener("click", () => {
      switchAuthView(button.dataset.target);
    });
  });

  $$(".switch-to-signup").forEach(button => {
    button.addEventListener("click", () => {
      hideError(loginError);
      switchAuthView("signup");
    });
  });

  $$(".switch-to-login").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      hideError(signupError);
      switchAuthView("login");
    });
  });

  // ===== PASSWORD VISIBILITY =====
  $$(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
      const input = $(`#${button.dataset.for}`);
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";

      const icon = $("i", button);
      if (icon) {
        icon.classList.toggle("fa-eye", !show);
        icon.classList.toggle("fa-eye-slash", show);
      }

      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  // ===== SIGN UP =====
  signupForm.addEventListener("submit", event => {
    event.preventDefault();
    hideError(signupError);

    const name = $("#fullName").value.trim();
    const email = $("#signupEmail").value.trim().toLowerCase();
    const password = $("#signupPassword").value;

    if (!name || !email || !password) {
      showError(signupError, "Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      showError(signupError, "Password must contain at least 6 characters.");
      return;
    }

    const users = read("users", []);

    if (users.some(user => user.email.toLowerCase() === email)) {
      showError(signupError, "An account with this email already exists.");
      return;
    }

    users.push({ name, email, password });
    save("users", users);

    signupForm.reset();
    notify("Account created successfully! You can now log in.");
    switchAuthView("login");
    $("#loginUsername").value = email;
    $("#loginPassword").focus();
  });

  // ===== LOGIN =====
  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    hideError(loginError);

    const username = $("#loginUsername").value.trim().toLowerCase();
    const password = $("#loginPassword").value;

    const user = read("users", []).find(item =>
      item.email.toLowerCase() === username ||
      item.name.toLowerCase() === username
    );

    if (!user || user.password !== password) {
      showError(loginError, "Invalid username/email or password.");
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", user.name);

    // Remember me is optional; unchecked login lasts for this tab session.
    if ($("#rememberMe").checked) {
      localStorage.setItem("rememberLogin", "true");
    } else {
      localStorage.setItem("rememberLogin", "false");
      sessionStorage.setItem("sessionLogin", "true");
    }

    loginForm.reset();
    showDashboard();
  });

  // ===== FORGOT PASSWORD DEMO =====
  $("#forgotPassword").addEventListener("click", event => {
    event.preventDefault();
    notify("Please contact your system administrator to reset your password.");
  });

  // ===== PROFILE =====
  function updateProfile() {
    const name = currentUser() || "Guest";
    const firstName = name.trim().split(/\s+/)[0];

    $("#displayUsername").textContent = name;
    $("#profileInitials").textContent = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join("");

    const role = $(".user-role");
    if (role) role.textContent = "Student";

    // Update greeting if the dashboard greeting exists.
    const greeting = $("#greetingText");
    if (greeting) greeting.textContent = `Welcome, ${firstName}!`;
  }

  // ===== APPOINTMENT DATA =====
  function getAllAppointments() {
    return read("appointments", []);
  }

  function getAppointments() {
    return getAllAppointments().filter(item => item.owner === currentUser());
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getUpcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return getAppointments()
      .filter(item =>
        new Date(`${item.date}T00:00:00`) >= today &&
        !["Cancelled", "Completed"].includes(item.status)
      )
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  function statusClass(status) {
    return String(status).toLowerCase();
  }

  function appointmentRow(item) {
    return `
      <tr>
        <td>
          <div class="date-cell">
            <i class="fa-regular fa-calendar icon"></i>
            <div>
              <strong>${escapeHTML(formatDate(item.date))}</strong>
              <span class="time-sub">${escapeHTML(formatTime(item.time))}</span>
            </div>
          </div>
        </td>
        <td>${escapeHTML(item.service)}</td>
        <td>
          <span class="status-badge ${statusClass(item.status)}">
            ${escapeHTML(item.status)}
          </span>
        </td>
        <td>
          <div class="action-cell">
            <button type="button" class="table-action-btn"
              data-action="view" data-id="${item.id}">View</button>
            ${
              !["Cancelled", "Completed"].includes(item.status)
                ? `<button type="button" class="table-action-btn cancel"
                    data-action="cancel" data-id="${item.id}">Cancel</button>`
                : ""
            }
          </div>
        </td>
      </tr>
    `;
  }

  function appointmentsTable(items, emptyMessage = "No appointments found.") {
    const search = $("#searchInput")?.value.trim().toLowerCase() || "";

    const filtered = items.filter(item =>
      `${item.service} ${item.status} ${item.date} ${item.time}`
        .toLowerCase()
        .includes(search)
    );

    return `
      <div class="table-responsive">
        <table class="appointments-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Service</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length
                ? filtered.map(appointmentRow).join("")
                : `<tr><td colspan="4" class="empty-state">${escapeHTML(emptyMessage)}</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;
  }

  function getMetrics() {
    const appointments = getAppointments();
    const completed = appointments.filter(a => a.status === "Completed").length;
    const pending = appointments.filter(a => a.status === "Pending").length;
    const cancelled = appointments.filter(a => a.status === "Cancelled").length;

    return {
      upcoming: getUpcoming().length,
      completed,
      pending,
      cancelled,
      total: appointments.length
    };
  }

  // ===== DASHBOARD TEMPLATE =====
  function dashboardTemplate() {
    const metrics = getMetrics();
    const upcoming = getUpcoming().slice(0, 5);
    const recent = [...getAppointments()]
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 4);

    return `
      <div class="dashboard-greeting">
        <div>
          <h2 id="greetingText">Welcome!</h2>
          <p>Here's what's happening with your appointments.</p>
        </div>
        <div class="current-date">
          <span>${escapeHTML(new Date().toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric"
          }))}</span>
          <i class="fa-regular fa-calendar"></i>
        </div>
      </div>

      <div class="metrics-grid">
        ${metricCard("blue", "Upcoming Appointments", metrics.upcoming, "fa-calendar")}
        ${metricCard("green", "Completed", metrics.completed, "fa-square-check")}
        ${metricCard("yellow", "Pending", metrics.pending, "fa-clock")}
        ${metricCard("red", "Cancelled", metrics.cancelled, "fa-circle-xmark")}
      </div>

      <div class="content-grid">
        <div class="left-column">
          <div class="panel calendar-panel">
            <div class="calendar-header">
              <span class="calendar-month"></span>
              <div class="calendar-nav">
                <button type="button" class="cal-btn" id="prevMonth" aria-label="Previous month">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button type="button" class="cal-btn" id="nextMonth" aria-label="Next month">
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <div class="calendar-grid"></div>
          </div>
          <button class="btn btn-primary btn-block" data-page="book">
            <i class="fa-regular fa-calendar-plus"></i> Book an Appointment
          </button>
        </div>

        <div class="right-column">
          <div class="panel">
            <div class="panel-header">
              <h3>Upcoming Appointments</h3>
              <a href="#" class="view-all-link" data-page="appointments">View All</a>
            </div>
            ${appointmentsTable(upcoming, "No upcoming appointments.")}
          </div>
        </div>
      </div>

      <div class="bottom-grid">
        <div class="panel">
          <div class="panel-header"><h3>Recent Appointments</h3></div>
          <div class="recent-list">
            ${
              recent.length
                ? recent.map(item => `
                  <div class="recent-item">
                    <div class="recent-info">
                      <i class="fa-regular fa-calendar-check icon ${
                        item.status === "Completed" ? "green-icon" :
                        item.status === "Cancelled" ? "red-icon" : "yellow-icon"
                      }"></i>
                      <div>
                        <div class="recent-date">${escapeHTML(formatDate(item.date))} • ${escapeHTML(formatTime(item.time))}</div>
                        <div class="recent-service">${escapeHTML(item.service)}</div>
                      </div>
                    </div>
                    <span class="status-tag ${
                      item.status === "Completed" ? "green" :
                      item.status === "Cancelled" ? "red" : "yellow"
                    }">${escapeHTML(item.status)}</span>
                  </div>
                `).join("")
                : `<p class="form-note">No appointment history yet.</p>`
            }
          </div>
          <div class="recent-footer">
            <a href="#" data-page="history">View History <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>Quick Actions</h3></div>
          <div class="quick-actions-grid">
            <button class="quick-action-card" data-page="book">
              <i class="fa-regular fa-calendar-plus icon"></i><span>Book Appointment</span>
            </button>
            <button class="quick-action-card" data-page="appointments">
              <i class="fa-regular fa-calendar-days icon"></i><span>Manage Schedule</span>
            </button>
            <button class="quick-action-card" data-page="reports">
              <i class="fa-solid fa-chart-column icon"></i><span>View Reports</span>
            </button>
            <button class="quick-action-card" data-page="history">
              <i class="fa-regular fa-clock icon"></i><span>Appointment History</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function metricCard(color, title, value, icon) {
    return `
      <div class="metric-card ${color}" role="button" tabindex="0"
        data-metric="${escapeHTML(title)}">
        <div class="metric-header">
          <div class="icon-wrapper"><i class="fa-regular ${icon.includes("calendar") ? "fa-calendar" : ""} fa-${icon}"></i></div>
        </div>
        <div class="metric-title">${escapeHTML(title)}</div>
        <div class="metric-value-row">
          <span class="metric-value">${value}</span>
          <i class="fa-solid fa-chevron-right arrow"></i>
        </div>
      </div>
    `;
  }

  // ===== PAGE NAVIGATION =====
  const pageNames = {
    dashboard: "Dashboard",
    book: "Book Appointment",
    appointments: "My Appointments",
    history: "Appointment History",
    reports: "Reports",
    settings: "Settings"
  };

  function setActiveNav(page) {
    $$(".sidebar-nav li").forEach(li => li.classList.remove("active"));

    const link = $(`.nav-item-btn[data-page="${page}"]`);
    if (link) link.closest("li")?.classList.add("active");

    // Settings is in the sidebar footer, not the main list.
    $$('.sidebar-footer [data-page]').forEach(item => {
      item.classList.toggle("active", item.dataset.page === page);
    });
  }

  function pageHeading(title, subtitle) {
    return `
      <div class="page-heading">
        <div>
          <h2>${escapeHTML(title)}</h2>
          <p>${escapeHTML(subtitle)}</p>
        </div>
      </div>
    `;
  }

  function renderAppointmentsPage(historyOnly = false) {
    const all = getAppointments();
    const items = historyOnly
      ? all.filter(a => ["Completed", "Cancelled"].includes(a.status))
      : all;

    return `
      ${pageHeading(
        historyOnly ? "Appointment History" : "My Appointments",
        historyOnly
          ? "Review your completed and cancelled appointments."
          : "View and manage all your appointments."
      )}
      <div class="page-card">
        <div class="panel-header">
          <h3>${historyOnly ? "Past Appointments" : "All Appointments"}</h3>
          ${
            !historyOnly
              ? `<button type="button" class="btn btn-primary" data-page="book">
                  <i class="fa-solid fa-plus"></i> Book Appointment
                </button>`
              : ""
          }
        </div>
        ${appointmentsTable(items)}
      </div>
    `;
  }

  function renderReportsPage() {
    const metrics = getMetrics();

    return `
      ${pageHeading("Reports", "Summary of your appointment activity.")}

      <div class="report-cards">
        <div class="report-card"><span>Total Appointments</span><strong>${metrics.total}</strong></div>
        <div class="report-card"><span>Upcoming</span><strong>${metrics.upcoming}</strong></div>
        <div class="report-card"><span>Completed</span><strong>${metrics.completed}</strong></div>
        <div class="report-card"><span>Cancelled</span><strong>${metrics.cancelled}</strong></div>
      </div>

      <div class="page-card">
        <div class="panel-header"><h3>Appointment Report</h3></div>
        ${appointmentsTable(getAppointments(), "No data available for the report.")}
        <p class="form-note">This report displays appointment records saved in this browser.</p>
        <button type="button" class="btn btn-outline" id="printReport">
          <i class="fa-solid fa-print"></i> Print Report
        </button>
      </div>
    `;
  }

  function renderBookingPage() {
    const today = new Date();
    const minDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    return `
      ${pageHeading("Book Appointment", "Fill out the form to schedule an appointment.")}

      <div class="page-card">
        <form id="bookingForm" class="booking-form">
          <label for="bookingService">Service</label>
          <select id="bookingService" required>
            <option value="">Select a service</option>
            <option>Consultation</option>
            <option>Follow-up</option>
            <option>Document Request</option>
            <option>General Inquiry</option>
          </select>

          <label for="bookingDate">Appointment Date</label>
          <input id="bookingDate" type="date" min="${minDate}" required>

          <label for="bookingTime">Appointment Time</label>
          <input id="bookingTime" type="time" required>

          <p class="form-note">Appointments use a demo schedule stored in your browser.</p>
          <button type="submit" class="btn btn-primary">
            <i class="fa-regular fa-calendar-check"></i> Confirm Appointment
          </button>
        </form>
      </div>
    `;
  }

  function renderSettingsPage() {
    const user = getUser();

    return `
      ${pageHeading("Settings", "Update your account information.")}

      <div class="page-card">
        <form id="settingsForm" class="settings-form">
          <label for="settingsName">Full Name</label>
          <input id="settingsName" type="text" value="${escapeHTML(user?.name || currentUser())}" required>

          <label for="settingsEmail">Email Address</label>
          <input id="settingsEmail" type="email" value="${escapeHTML(user?.email || "")}" disabled>

          <p class="form-note">Changing your name also updates the owner name of your saved appointments.</p>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk"></i> Save Changes
          </button>
        </form>
      </div>
    `;
  }

  function renderPage(page) {
    if (!isLoggedIn()) {
      switchAuthView("login");
      return;
    }

    if (!pageNames[page]) page = "dashboard";
    currentPage = page;

    setActiveNav(page);
    $("#searchInput").value = "";

    switch (page) {
      case "dashboard":
        pageContent.innerHTML = dashboardTemplate();
        updateProfile();
        renderCalendar();
        break;

      case "book":
        pageContent.innerHTML = renderBookingPage();
        break;

      case "appointments":
        pageContent.innerHTML = renderAppointmentsPage(false);
        break;

      case "history":
        pageContent.innerHTML = renderAppointmentsPage(true);
        break;

      case "reports":
        pageContent.innerHTML = renderReportsPage();
        break;

      case "settings":
        pageContent.innerHTML = renderSettingsPage();
        break;
    }
  }

  // ===== SIDEBAR / PAGE BUTTONS =====
  document.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-page]");

    if (pageButton) {
      event.preventDefault();

      if (!isLoggedIn()) {
        switchAuthView("login");
        return;
      }

      const page = pageButton.dataset.page;

      if (page === "book") {
        renderPage("book");
      } else {
        renderPage(page);
      }
      return;
    }

    const metric = event.target.closest("[data-metric]");
    if (metric) {
      const label = metric.dataset.metric;

      if (label === "Upcoming Appointments") {
        renderPage("appointments");
      } else if (label === "Completed" || label === "Pending" || label === "Cancelled") {
        renderPage("appointments");
        const search = $("#searchInput");
        if (search) search.value = "";
        const rows = $$(".appointments-table tbody tr");
        rows.forEach(row => {
          row.hidden = !row.textContent.toLowerCase().includes(label.toLowerCase());
        });
      }
    }
  });

  document.addEventListener("keydown", event => {
    const metric = event.target.closest("[data-metric]");
    if (metric && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      metric.click();
    }
  });

  // ===== BOOK APPOINTMENT SUBMISSION =====
  document.addEventListener("submit", event => {
    if (event.target.id !== "bookingForm") return;

    event.preventDefault();

    if (!isLoggedIn()) {
      switchAuthView("login");
      return;
    }

    const service = $("#bookingService").value;
    const date = $("#bookingDate").value;
    const time = $("#bookingTime").value;

    if (!service || !date || !time) {
      notify("Please complete all appointment fields.");
      return;
    }

    const chosenDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(chosenDate.getTime()) || chosenDate < today) {
      notify("Please select a valid date today or in the future.");
      return;
    }

    const appointments = getAllAppointments();

    const conflict = appointments.some(item =>
      item.date === date &&
      item.time === time &&
      item.status !== "Cancelled"
    );

    if (conflict) {
      notify("That time slot is already booked. Please choose another.");
      return;
    }

    appointments.push({
      id: Date.now(),
      date,
      time,
      service,
      status: "Pending",
      owner: currentUser()
    });

    save("appointments", appointments);
    notify("Appointment booked successfully!");
    renderPage("appointments");
  });

  // ===== VIEW / CANCEL APPOINTMENT =====
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (!isLoggedIn()) {
      switchAuthView("login");
      return;
    }

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const appointments = getAllAppointments();

    const item = appointments.find(a =>
      a.id === id && a.owner === currentUser()
    );

    if (!item) {
      notify("Appointment not found.");
      return;
    }

    if (action === "view") {
      notify(
        `Appointment Details\n\nService: ${item.service}\n` +
        `Date: ${formatDate(item.date)}\n` +
        `Time: ${formatTime(item.time)}\nStatus: ${item.status}`
      );
    }

    if (action === "cancel") {
      if (["Completed", "Cancelled"].includes(item.status)) {
        notify("This appointment cannot be cancelled.");
        return;
      }

      if (!confirm("Are you sure you want to cancel this appointment?")) return;

      item.status = "Cancelled";
      save("appointments", appointments);
      renderPage(currentPage);
      notify("Appointment cancelled.");
    }
  });

  // ===== SETTINGS SUBMISSION =====
  document.addEventListener("submit", event => {
    if (event.target.id !== "settingsForm") return;

    event.preventDefault();

    const newName = $("#settingsName").value.trim();
    if (!newName) {
      notify("Please enter your name.");
      return;
    }

    const oldName = currentUser();
    const users = read("users", []);
    const user = users.find(item => item.name === oldName);

    if (!user) {
      notify("Account not found. Please log in again.");
      return;
    }

    user.name = newName;
    save("users", users);

    const appointments = getAllAppointments();
    appointments.forEach(item => {
      if (item.owner === oldName) item.owner = newName;
    });
    save("appointments", appointments);

    localStorage.setItem("currentUser", newName);
    updateProfile();
    renderPage("settings");
    notify("Your account information has been updated.");
  });

  // ===== CALENDAR =====
  function renderCalendar() {
    const grid = $(".calendar-grid");
    const label = $(".calendar-month");

    if (!grid || !label) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    label.textContent = calendarDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    const appointmentDates = new Set(
      getAppointments()
        .filter(a => a.status !== "Cancelled")
        .map(a => a.date)
    );

    let html = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .map(day => `<div class="day-name">${day}</div>`)
      .join("");

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="day-cell" aria-hidden="true"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const hasAppointment = appointmentDates.has(dateString);
      const active = dateString === todayString;

      html += `
        <button type="button"
          class="day-cell ${active ? "active" : ""} ${hasAppointment ? "has-appointment" : ""}"
          data-date="${dateString}"
          title="${hasAppointment ? "Has appointment" : dateString}">
          ${day}
        </button>
      `;
    }

    grid.innerHTML = html;
  }

  document.addEventListener("click", event => {
    if (event.target.closest("#prevMonth")) {
      calendarDate = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() - 1,
        1
      );
      renderCalendar();
    }

    if (event.target.closest("#nextMonth")) {
      calendarDate = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        1
      );
      renderCalendar();
    }

    const dateButton = event.target.closest(".calendar-grid [data-date]");
    if (dateButton) {
      const date = dateButton.dataset.date;
      const matches = getAppointments().filter(a => a.date === date);

      notify(
        `${formatDate(date)}\n\n` +
        (matches.length
          ? matches.map(a =>
              `${formatTime(a.time)} — ${a.service} (${a.status})`
            ).join("\n")
          : "No appointments scheduled for this date.")
      );
    }
  });

  // ===== SEARCH =====
  $("#searchInput").addEventListener("input", () => {
    const query = $("#searchInput").value.trim().toLowerCase();

    $$(".appointments-table tbody tr").forEach(row => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  });

  // ===== REPORT PRINT =====
  document.addEventListener("click", event => {
    if (event.target.closest("#printReport")) {
      window.print();
    }
  });

  // ===== NOTIFICATIONS =====
  $("#bellBtn").addEventListener("click", () => {
    if (!isLoggedIn()) {
      switchAuthView("login");
      return;
    }

    const pending = getAppointments().filter(a => a.status === "Pending");
    notify(
      pending.length
        ? `You have ${pending.length} pending appointment(s).`
        : "You have no pending appointment notifications."
    );
  });

  // ===== LOGOUT =====
  $("#logoutBtn").addEventListener("click", event => {
    event.preventDefault();

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberLogin");
    sessionStorage.removeItem("sessionLogin");

    loginForm.reset();
    hideError(loginError);

    currentPage = "dashboard";
    switchAuthView("login");
    notify("You have logged out successfully.");
  });

  // ===== PREVENT EMPTY LINKS FROM JUMPING =====
  document.addEventListener("click", event => {
    const link = event.target.closest('a[href="#"]');
    if (link && !link.dataset.page) {
      event.preventDefault();
    }
  });

  // ===== INITIALIZE =====
  // A remembered login stays active. Otherwise require login again after refresh.
  const remembered = localStorage.getItem("rememberLogin") === "true";
  const sameTabSession = sessionStorage.getItem("sessionLogin") === "true";

  if (isLoggedIn() && (remembered || sameTabSession)) {
    showDashboard();
  } else {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    switchAuthView("login");
  }
});
