/* ========================================
   CampusPilot AI - Frontend Functionality
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // 1. Get HTML elements

    const taskDialog = document.getElementById("task-dialog");
    const taskForm = document.getElementById("task-form");
    const taskTitle = document.getElementById("task-title");
    const taskSubject = document.getElementById("task-subject");
    const taskDeadline = document.getElementById("task-deadline");
    const taskPriority = document.getElementById("task-priority");

    const taskList = document.getElementById("task-list");
    const totalTasks = document.getElementById("total-tasks");
    const completedTasks = document.getElementById("completed-tasks");
    const pendingTasks = document.getElementById("pending-tasks");
    const studyProgress = document.getElementById("study-progress");

    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const assistantWelcome = document.querySelector(".assistant-welcome");
    const suggestionList = document.querySelector(".suggestion-list");

    const plannerPanel = document.querySelector(".planner-panel");
    const addTaskButton = document.getElementById("add-task-button");
    const emptyAddTask = document.getElementById("empty-add-task");
    const closeDialog = document.getElementById("close-dialog");
    const cancelTask = document.getElementById("cancel-task");

    const filterButtons = document.querySelectorAll(".filter-button");
    const navigationLinks = document.querySelectorAll(".nav-link");
    const suggestionButtons = document.querySelectorAll(".suggestion-button");

    // 2. Application state

    const API_BASE_URL = "http://127.0.0.1:8000";
    const TASK_META_PREFIX = "__CAMPUSPILOT_META__:";

    let tasks = [];
    let activeFilter = "all";

    // The current backend stores title, description, due_date,
    // and completed. Subject and priority are temporarily stored
    // inside description until we update the database schema.

    function encodeTaskMetadata(subject, priority) {
        return TASK_META_PREFIX + JSON.stringify({
            subject: subject || "General",
            priority: priority || "medium"
        });
    }

    function decodeTaskMetadata(description) {
        if (
            typeof description !== "string" ||
            !description.startsWith(TASK_META_PREFIX)
        ) {
            return {
                subject: "General",
                priority: "medium"
            };
        }

        try {
            const metadata = JSON.parse(
                description.slice(TASK_META_PREFIX.length)
            );

            return {
                subject: typeof metadata.subject === "string"
                    ? metadata.subject
                    : "General",

                priority: ["low", "medium", "high"].includes(
                    metadata.priority
                )
                    ? metadata.priority
                    : "medium"
            };
        } catch (error) {
            console.warn("Could not read task metadata:", error);

            return {
                subject: "General",
                priority: "medium"
            };
        }
    }

    // Convert a task returned by the backend into the format
    // used by the frontend.

    function normalizeTask(apiTask) {
        const metadata = decodeTaskMetadata(
            apiTask.description || ""
        );

        return {
            id: Number(apiTask.id),
            title: String(apiTask.title || "Untitled task"),
            subject: metadata.subject,
            priority: metadata.priority,
            deadline: String(
                apiTask.due_date || apiTask.deadline || ""
            ),
            completed: Boolean(apiTask.completed),
            createdAt: apiTask.created_at || apiTask.createdAt || ""
        };
    }

    // 3. Send requests to FastAPI

    async function apiRequest(path, options = {}) {
        const response = await fetch(
            `${API_BASE_URL}${path}`,
            {
                ...options,

                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = typeof data.detail === "string"
                ? data.detail
                : `Request failed with status ${response.status}.`;

            throw new Error(message);
        }

        return data;
    }

    // 4. Load tasks from SQLite through FastAPI

    async function loadTasksFromAPI() {
        const data = await apiRequest(
            "/tasks?include_completed=true"
        );

        const apiTasks = Array.isArray(data)
            ? data
            : data.tasks;

        if (!Array.isArray(apiTasks)) {
            throw new Error(
                "The backend returned an unexpected task list."
            );
        }

        tasks = apiTasks.map(normalizeTask);

        return tasks;
    }

    // 5. Format dates

    function formatDate(dateString) {
        if (!dateString) {
            return "No deadline";
        }

        const date = new Date(dateString + "T12:00:00");

        if (Number.isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function getTodayString() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // 6. Open and close the task dialog

    function openTaskDialog() {
        taskForm.reset();

        taskDeadline.min = getTodayString();

        if (typeof taskDialog.showModal === "function") {
            taskDialog.showModal();
            taskTitle.focus();
        } else {
            alert(
                "Please open CampusPilot AI in an updated browser."
            );
        }
    }

    function closeTaskDialog() {
        if (taskDialog.open) {
            taskDialog.close();
        }
    }

    if (addTaskButton) {
        addTaskButton.addEventListener(
            "click",
            openTaskDialog
        );
    }

    if (emptyAddTask) {
        emptyAddTask.addEventListener(
            "click",
            openTaskDialog
        );
    }

    if (closeDialog) {
        closeDialog.addEventListener(
            "click",
            closeTaskDialog
        );
    }

    if (cancelTask) {
        cancelTask.addEventListener(
            "click",
            closeTaskDialog
        );
    }

    if (taskDialog) {
        taskDialog.addEventListener("click", event => {
            if (event.target === taskDialog) {
                closeTaskDialog();
            }
        });
    }

    // 7. Create a task in the database

    taskForm.addEventListener("submit", async event => {
        event.preventDefault();

        const title = taskTitle.value.trim();
        const subject = taskSubject.value.trim();
        const deadline = taskDeadline.value;
        const priority = taskPriority.value;

        if (!title) {
            alert("Please enter a task title.");
            taskTitle.focus();
            return;
        }

        if (!deadline) {
            alert("Please select a deadline.");
            taskDeadline.focus();
            return;
        }

        try {
            await apiRequest("/tasks", {
                method: "POST",

                body: JSON.stringify({
                    title: title,

                    description: encodeTaskMetadata(
                        subject || "General",
                        priority
                    ),

                    due_date: deadline
                })
            });

            // Reload the tasks after creating one.

            await loadTasksFromAPI();

            activeFilter = "all";

            updateFilterButtons();
            renderTasks();
            updateStatistics();
            renderStudyPlanner();

            closeTaskDialog();
            taskForm.reset();

        } catch (error) {
            console.error(
                "Could not create task:",
                error
            );

            alert(
                `Could not save the task: ${error.message}\n\n` +
                "Check that the backend is running."
            );
        }
    });

    // 8. Render the task list

    function renderTasks() {
        taskList.replaceChildren();

        let visibleTasks = tasks;

        if (activeFilter === "pending") {
            visibleTasks = tasks.filter(
                task => !task.completed
            );
        } else if (activeFilter === "completed") {
            visibleTasks = tasks.filter(
                task => task.completed
            );
        }

        if (visibleTasks.length === 0) {
            showEmptyState();
            return;
        }

        visibleTasks.forEach(task => {
            const item = document.createElement("div");

            item.className = "task-item";

            if (task.completed) {
                item.classList.add("is-completed");
            }

            // Checkbox

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.className = "task-checkbox";
            checkbox.checked = task.completed;

            checkbox.setAttribute(
                "aria-label",
                `Complete ${task.title}`
            );

            checkbox.addEventListener("change", () => {
                toggleTask(task.id);
            });

            // Task details

            const details = document.createElement("div");

            details.className = "task-details";

            const title = document.createElement("h3");

            title.textContent = task.title;

            const deadline = document.createElement("p");

            deadline.textContent =
                `Due ${formatDate(task.deadline)}`;

            // Subject and priority

            const meta = document.createElement("div");

            meta.className = "task-meta";

            const priority = document.createElement("span");

            priority.className =
                `priority-badge priority-${task.priority}`;

            priority.textContent =
                task.priority.charAt(0).toUpperCase() +
                task.priority.slice(1);

            const subject = document.createElement("span");

            subject.className = "subject-badge";
            subject.textContent = task.subject || "General";

            // Delete button

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "delete-task-button";
            deleteButton.textContent = "×";

            deleteButton.setAttribute(
                "aria-label",
                `Delete ${task.title}`
            );

            deleteButton.addEventListener("click", () => {
                deleteTask(task.id);
            });

            // Assemble the task card

            meta.append(priority, subject);

            details.append(
                title,
                deadline,
                meta
            );

            item.append(
                checkbox,
                details,
                deleteButton
            );

            taskList.appendChild(item);
        });
    }

    // 9. Show an empty task message

    function showEmptyState() {
        const wrapper = document.createElement("div");

        wrapper.className = "empty-state";

        const icon = document.createElement("div");

        icon.className = "empty-icon";
        icon.textContent = "☑";

        const heading = document.createElement("h3");
        const description = document.createElement("p");
        const button = document.createElement("button");

        if (activeFilter === "completed") {
            heading.textContent = "No completed tasks";

            description.textContent =
                "Completed tasks will appear here.";

        } else if (activeFilter === "pending") {
            heading.textContent = "No pending tasks";

            description.textContent =
                "You're all caught up on your tasks.";

        } else {
            heading.textContent = "No tasks yet";

            description.textContent =
                "Add your first task to start organizing your studies.";
        }

        button.type = "button";
        button.className = "secondary-button";
        button.textContent = "+ Create a task";

        button.addEventListener(
            "click",
            openTaskDialog
        );

        wrapper.append(
            icon,
            heading,
            description
        );

        if (activeFilter !== "completed") {
            wrapper.appendChild(button);
        }

        taskList.appendChild(wrapper);
    }

    // 10. Complete a task using the backend
    // The current backend supports completing tasks, but reopening
    // completed tasks requires another backend endpoint.

   
async function toggleTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    const endpoint = task.completed
        ? `/tasks/${taskId}/reopen`
        : `/tasks/${taskId}/complete`;

    try {
        await apiRequest(endpoint, {
            method: "PATCH"
        });

        await loadTasksFromAPI();

        renderTasks();
        updateStatistics();
        renderStudyPlanner();

    } catch (error) {
        console.error("Could not update task:", error);

        alert(`Could not update the task: ${error.message}`);

        renderTasks();
    }
}


    
    // 11. Delete a task from the database

    async function deleteTask(taskId) {
        const task = tasks.find(
            item => item.id === taskId
        );

        if (!task) {
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to delete "${task.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            // Delete the task through the FastAPI backend.
            await apiRequest(`/tasks/${taskId}`, {
                method: "DELETE"
            });

            // Reload the latest tasks from the database.
            await loadTasksFromAPI();

            // Refresh the dashboard.
            renderTasks();
            updateStatistics();
            renderStudyPlanner();

        } catch (error) {
            console.error("Could not delete task:", error);

            alert(
                `Could not delete the task: ${error.message}\n\n` +
                "Please check that the backend is running."
            );
        }
    }

    // 12. Filter tasks

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;

            updateFilterButtons();
            renderTasks();
        });
    });

    function updateFilterButtons() {
        filterButtons.forEach(button => {
            const isActive =
                button.dataset.filter === activeFilter;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });
    }

    // 13. Update dashboard statistics

    function updateStatistics() {
        const total = tasks.length;

        const completed = tasks.filter(
            task => task.completed
        ).length;

        const pending = total - completed;

        const progress = total === 0
            ? 0
            : Math.round((completed / total) * 100);

        totalTasks.textContent = total;
        completedTasks.textContent = completed;
        pendingTasks.textContent = pending;

        studyProgress.textContent = `${progress}%`;
    }

    // 14. Update the study planner

    function renderStudyPlanner() {
        plannerPanel.replaceChildren();

        const heading = document.createElement("div");

        heading.className = "panel-heading";

        const headingContent = document.createElement("div");

        const title = document.createElement("h2");
        const description = document.createElement("p");

        title.textContent = "Today's Study Planner";

        description.textContent =
            "Your upcoming academic priorities.";

        headingContent.append(
            title,
            description
        );

        const badge = document.createElement("span");

        badge.className = "planner-badge";

        badge.textContent =
            `${tasks.filter(task => !task.completed).length} pending`;

        heading.append(
            headingContent,
            badge
        );

        plannerPanel.appendChild(heading);

        const priorityRank = {
            high: 0,
            medium: 1,
            low: 2
        };

        const pending = tasks
            .filter(task => !task.completed)
            .sort((a, b) => {
                if (a.deadline !== b.deadline) {
                    return a.deadline.localeCompare(
                        b.deadline
                    );
                }

                return (
                    (priorityRank[a.priority] ?? 3) -
                    (priorityRank[b.priority] ?? 3)
                );
            });

        if (pending.length === 0) {
            const empty = document.createElement("div");

            empty.className = "planner-empty-state";

            const icon = document.createElement("div");

            icon.className = "planner-icon";
            icon.textContent = "▦";

            const content = document.createElement("div");

            const emptyTitle = document.createElement("h3");
            const emptyDescription = document.createElement("p");

            emptyTitle.textContent =
                "Your schedule starts here";

            emptyDescription.textContent =
                "Add tasks to see your upcoming priorities here.";

            content.append(
                emptyTitle,
                emptyDescription
            );

            empty.append(
                icon,
                content
            );

            plannerPanel.appendChild(empty);

            return;
        }

        const list = document.createElement("div");

        list.className = "task-list";

        pending.slice(0, 5).forEach(task => {
            const item = document.createElement("div");

            item.className = "task-item";

            const icon = document.createElement("div");

            icon.className = "stat-icon blue";
            icon.textContent = "◷";

            const details = document.createElement("div");

            details.className = "task-details";

            const taskTitle = document.createElement("h3");

            taskTitle.textContent = task.title;

            const deadline = document.createElement("p");

            deadline.textContent =
                `Deadline: ${formatDate(task.deadline)}`;

            details.append(
                taskTitle,
                deadline
            );

            item.append(
                icon,
                details
            );

            list.appendChild(item);
        });

        plannerPanel.appendChild(list);
    }

    // 15. AI chat connected to the FastAPI backend

    function showChatMessage(message, sender) {
        const bubble = document.createElement("div");

        bubble.style.padding = "12px";
        bubble.style.margin = "10px 0";
        bubble.style.borderRadius = "10px";
        bubble.style.fontSize = "12px";
        bubble.style.whiteSpace = "pre-wrap";
        bubble.style.overflowWrap = "anywhere";
        bubble.style.textAlign = "left";

        if (sender === "user") {
            bubble.style.background = "#eeedff";
            bubble.style.color = "#5145e5";
            bubble.style.marginLeft = "20px";
        } else {
            bubble.style.background = "#f1f3f9";
            bubble.style.color = "#182230";
            bubble.style.marginRight = "20px";
        }

        bubble.textContent = message;

        assistantWelcome.appendChild(bubble);

        assistantWelcome.scrollTop =
            assistantWelcome.scrollHeight;

        return bubble;
    }

    async function handleChatMessage(message) {
        if (!message.trim()) {
            return;
        }

        // Remove the welcome content when the first message is sent.

        assistantWelcome.querySelectorAll(
            ".assistant-sparkle, h3, p"
        ).forEach(item => item.remove());

        if (suggestionList) {
            suggestionList.style.display = "none";
        }

        // Display the user's message.

        showChatMessage(message, "user");

        // Display a temporary loading message.

        const loadingBubble = showChatMessage(
            "CampusPilot is thinking...",
            "assistant"
        );

        const sendButton = chatForm.querySelector(
            'button[type="submit"]'
        );

        if (sendButton) {
            sendButton.disabled = true;
        }

        if (chatInput) {
            chatInput.disabled = true;
        }

        try {
            // Send the message to FastAPI.

            const response = await fetch(
                `${API_BASE_URL}/api/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "The AI service returned an error."
                );
            }

            // Display the AI's reply.

            loadingBubble.textContent =
                data.reply || "I received an empty response.";

        } catch (error) {
            console.error(
                "CampusPilot chat error:",
                error
            );

            loadingBubble.textContent =
                "I couldn't connect to the AI service. " +
                "Please check that your backend is running and try again.";

        } finally {
            if (sendButton) {
                sendButton.disabled = false;
            }

            if (chatInput) {
                chatInput.disabled = false;
                chatInput.focus();
            }

            assistantWelcome.scrollTop =
                assistantWelcome.scrollHeight;
        }
    }

    // Handle chat form submission.

    if (chatForm && chatInput && assistantWelcome) {
        chatForm.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const message = chatInput.value.trim();

                if (!message) {
                    chatInput.focus();
                    return;
                }

                chatInput.value = "";

                await handleChatMessage(message);
            }
        );
    }

    // Handle suggested prompts.

    suggestionButtons.forEach(button => {
        button.addEventListener(
            "click",
            async () => {
                const prompt =
                    button.dataset.prompt ||
                    button.textContent.trim();

                await handleChatMessage(prompt);
            }
        );
    });

    // 16. Sidebar navigation

    navigationLinks.forEach(link => {
        link.addEventListener("click", () => {
            navigationLinks.forEach(item => {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });
    });

    // 17. Initial dashboard render

    renderTasks();
    updateStatistics();
    renderStudyPlanner();
    updateFilterButtons();

    // Load tasks from the backend after the page starts.

    loadTasksFromAPI()
        .then(() => {
            renderTasks();
            updateStatistics();
            renderStudyPlanner();
        })
        .catch(error => {
            console.error(
                "Could not load tasks from the backend:",
                error
            );

            alert(
                "CampusPilot could not load tasks from the database. " +
                "Make sure the FastAPI backend is running, then refresh this page."
            );
        });

});