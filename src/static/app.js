document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("email");
  const messageEl = document.getElementById("message");

  let activities = {};

  function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = ""; // reset
    messageEl.classList.add("message", type);
    messageEl.classList.remove("hidden");
    setTimeout(() => {
      messageEl.classList.add("hidden");
    }, 4000);
  }

  function createParticipantsSection(participants) {
    const wrapper = document.createElement("div");
    wrapper.className = "participants-section";

    const header = document.createElement("div");
    header.className = "participants-header";

    const title = document.createElement("h5");
    title.textContent = "Participants";
    header.appendChild(title);

    const badge = document.createElement("span");
    badge.className = "participant-count";
    badge.textContent = participants.length;
    header.appendChild(badge);

    wrapper.appendChild(header);

    if (!participants || participants.length === 0) {
      const empty = document.createElement("div");
      empty.className = "participants-empty";
      empty.textContent = "No participants yet. Be the first!";
      wrapper.appendChild(empty);
      return wrapper;
    }

    const ul = document.createElement("ul");
    ul.className = "participants-list";
    participants.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      ul.appendChild(li);
    });
    wrapper.appendChild(ul);
    return wrapper;
  }

  function renderActivities() {
    activitiesListEl.innerHTML = "";
    Object.keys(activities).forEach((name) => {
      const activity = activities[name];

      const card = document.createElement("div");
      card.className = "activity-card";

      const h4 = document.createElement("h4");
      h4.textContent = name;
      card.appendChild(h4);

      const desc = document.createElement("p");
      desc.textContent = activity.description;
      card.appendChild(desc);

      const sched = document.createElement("p");
      sched.innerHTML = `<strong>Schedule:</strong> ${activity.schedule}`;
      card.appendChild(sched);

      const cap = document.createElement("p");
      cap.innerHTML = `<strong>Capacity:</strong> ${activity.participants.length} / ${activity.max_participants}`;
      card.appendChild(cap);

      // Participants section
      card.appendChild(createParticipantsSection(activity.participants || []));

      activitiesListEl.appendChild(card);
    });
  }

  function populateActivitySelect() {
    // Clear existing options except the placeholder
    activitySelect.querySelectorAll("option:not([value=''])").forEach((o) => o.remove());
    Object.keys(activities).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  function fetchActivities() {
    activitiesListEl.innerHTML = "<p>Loading activities...</p>";
    fetch("/activities")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activities");
        return res.json();
      })
      .then((data) => {
        activities = data;
        renderActivities();
        populateActivitySelect();
      })
      .catch((err) => {
        activitiesListEl.innerHTML = `<p class="error">Error loading activities: ${err.message}</p>`;
      });
  }

  signupForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const email = emailInput.value.trim();
    const activityName = activitySelect.value;
    if (!email || !activityName) {
      showMessage("Please provide your email and select an activity.", "error");
      return;
    }

    const url = `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`;
    fetch(url, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const detail = err.detail || res.statusText || "Signup failed";
          throw new Error(detail);
        }
        return res.json();
      })
      .then((body) => {
        // Update local activities and UI
        if (activities[activityName]) {
          activities[activityName].participants.push(email);
          renderActivities();
        } else {
          // reload from server if missing
          fetchActivities();
        }
        showMessage(body.message || "Signed up successfully!", "success");
        signupForm.reset();
      })
      .catch((e) => {
        showMessage(e.message || "Signup failed", "error");
      });
  });

  // Initial load
  fetchActivities();
});
