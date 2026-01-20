// Data storage
let students = JSON.parse(localStorage.getItem("students")) || [];
let classes = JSON.parse(localStorage.getItem("classes")) || [];
let monthlyFee = parseFloat(localStorage.getItem("monthlyFee")) || 20000;
let currentYear =
  parseInt(localStorage.getItem("currentYear")) || new Date().getFullYear();
let currentStudentId = null;

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  updateCurrentDate();
  updateStats();
  loadClassesToSelects();
  renderStudentsTable();
  updateMonthlyFeeDisplay();
});

function updateCurrentDate() {
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  document.getElementById("currentDate").textContent =
    `Today: ${now.toLocaleDateString("en-US", options)}`;
}

function updateMonthlyFeeDisplay() {
  document.getElementById("monthlyFeeDisplay").textContent =
    `Monthly Fee: 💵${monthlyFee.toFixed(2)}`;
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
  if (modalId) {
    document.getElementById(modalId).style.display = "none";
  } else {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.style.display = "none";
    });
  }
}

// Student Management
function openAddStudentModal() {
  loadClassesToSelects();
  document.getElementById("studentName").value = "";
  openModal("addStudentModal");
}

function closeAddStudentModal() {
  closeModal("addStudentModal");
}

function saveStudent() {
  const name = document.getElementById("studentName").value.trim();
  const className = document.getElementById("studentClass").value;

  if (!name || !className) {
    alert("Please fill in all fields");
    return;
  }

  const student = {
    id: Date.now(),
    name: name,
    class: className,
    payments: Array(new Date().getMonth() + 1).fill(false), // From Jan to current month
    createdAt: new Date().toISOString(),
  };

  students.push(student);
  saveToLocalStorage();
  renderStudentsTable();
  updateStats();
  closeAddStudentModal();
  alert("Student added successfully!");
}

// Class Management
function openAddClassModal() {
  document.getElementById("className").value = "";
  openModal("addClassModal");
}

function closeAddClassModal() {
  closeModal("addClassModal");
}

function saveClass() {
  const className = document.getElementById("className").value.trim();

  if (!className) {
    alert("Please enter a class name");
    return;
  }

  if (!classes.includes(className)) {
    classes.push(className);
    saveToLocalStorage();
    loadClassesToSelects();
    closeAddClassModal();
    alert("Class added successfully!");
  } else {
    alert("Class already exists!");
  }
}

// Setup Management
function openSetupModal() {
  document.getElementById("monthlyFee").value = monthlyFee;
  document.getElementById("currentYear").value = currentYear;
  openModal("setupModal");
}

function closeSetupModal() {
  closeModal("setupModal");
}

function saveSetup() {
  const fee = parseFloat(document.getElementById("monthlyFee").value);
  const year = parseInt(document.getElementById("currentYear").value);

  if (isNaN(fee) || fee < 0) {
    alert("Please enter a valid fee amount");
    return;
  }

  monthlyFee = fee;
  currentYear = year;
  localStorage.setItem("monthlyFee", monthlyFee);
  localStorage.setItem("currentYear", currentYear);
  updateMonthlyFeeDisplay();
  updateStats();
  closeSetupModal();
  alert("Setup saved successfully!");
}

// Student Table Rendering
function renderStudentsTable(filteredStudents = null) {
  const tableBody = document.getElementById("studentsTableBody");
  const studentsToRender = filteredStudents || students;

  tableBody.innerHTML = "";

  if (studentsToRender.length === 0) {
    tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            No students found. Add your first student!
                        </td>
                    </tr>
                `;
    return;
  }

  studentsToRender.forEach((student) => {
    const paidMonths = student.payments.filter((p) => p).length;
    const totalMonths = student.payments.length;
    const monthsOwed = totalMonths - paidMonths;
    const totalPaid = paidMonths * monthlyFee;
    const status =
      paidMonths === 0
        ? "unpaid"
        : paidMonths === totalMonths
          ? "paid"
          : "partial";

    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>${monthsOwed} month${monthsOwed !== 1 ? "s" : ""}</td>
                    <td>💵${totalPaid.toFixed(2)}</td>
                    <td>
                        <span class="status-indicator status-${status}"></span>
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </td>
                    <td class="action-buttons">
                        <button class="action-btn btn-primary" onclick="viewStudent(${student.id})">
                            View
                        </button>
                        <button class="action-btn btn-warning" onclick="editStudent(${student.id})">
                            Edit
                        </button>
                    </td>
                `;
    tableBody.appendChild(row);
  });
}

// View Student Details
function viewStudent(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  currentStudentId = studentId;

  const paidMonths = student.payments.filter((p) => p).length;
  const totalMonths = student.payments.length;
  const totalPaid = paidMonths * monthlyFee;
  const totalDue = totalMonths * monthlyFee;
  const monthsOwed = totalMonths - paidMonths;

  document.getElementById("modalTitle").textContent = student.name;
  document.getElementById("modalStudentName").textContent = student.name;
  document.getElementById("modalStudentClass").textContent = student.class;
  document.getElementById("modalTotalPaid").textContent =
    `💵${totalPaid.toFixed(2)}`;
  document.getElementById("modalMonthsOwed").textContent =
    `${monthsOwed} month${monthsOwed !== 1 ? "s" : ""}`;

  document.getElementById("totalMonths").textContent = totalMonths;
  document.getElementById("paidMonths").textContent = paidMonths;
  document.getElementById("unpaidMonths").textContent = monthsOwed;
  document.getElementById("totalDue").textContent = `💵${totalDue.toFixed(2)}`;

  // Render month grid
  const monthGrid = document.getElementById("monthGrid");
  monthGrid.innerHTML = "";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  for (let i = 0; i < totalMonths; i++) {
    const monthBox = document.createElement("div");
    monthBox.className = `month-box ${student.payments[i] ? "paid" : "unpaid"} ${i > 0 && !student.payments[i - 1] ? "disabled" : ""}`;
    monthBox.innerHTML = `
                    <div class="month-name">${monthNames[i]}</div>
                    <div class="month-status">${student.payments[i] ? "PAID" : "UNPAID"}</div>
                `;

    monthBox.onclick = () => togglePayment(i);
    monthGrid.appendChild(monthBox);
  }

  openModal("studentModal");
}

function togglePayment(monthIndex) {
  const student = students.find((s) => s.id === currentStudentId);
  if (!student) return;

  // Check if previous month is paid (except for January)
  if (monthIndex > 0 && !student.payments[monthIndex - 1]) {
    alert("Cannot mark this month as paid until previous month is paid");
    return;
  }

  student.payments[monthIndex] = !student.payments[monthIndex];
  saveToLocalStorage();
  viewStudent(currentStudentId);
  updateStats();
  renderStudentsTable();
}

// Edit Student
function editStudent(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  currentStudentId = studentId;
  document.getElementById("editStudentName").value = student.name;

  loadClassesToSelects("editStudentClass");
  document.getElementById("editStudentClass").value = student.class;

  openModal("editStudentModal");
}

function closeEditStudentModal() {
  closeModal("editStudentModal");
}

function updateStudent() {
  const name = document.getElementById("editStudentName").value.trim();
  const className = document.getElementById("editStudentClass").value;

  if (!name || !className) {
    alert("Please fill in all fields");
    return;
  }

  const studentIndex = students.findIndex((s) => s.id === currentStudentId);
  if (studentIndex !== -1) {
    students[studentIndex].name = name;
    students[studentIndex].class = className;
    saveToLocalStorage();
    renderStudentsTable();
    updateStats();
    closeEditStudentModal();
    alert("Student updated successfully!");
  }
}

function deleteStudent() {
  if (
    confirm(
      "Are you sure you want to delete this student? This action cannot be undone.",
    )
  ) {
    students = students.filter((s) => s.id !== currentStudentId);
    saveToLocalStorage();
    renderStudentsTable();
    updateStats();
    closeEditStudentModal();
    alert("Student deleted successfully!");
  }
}

// Filtering
function filterStudents() {
  const classFilter = document.getElementById("classFilter").value;
  const paymentFilter = document.getElementById("paymentFilter").value;
  const searchFilter = document
    .getElementById("searchFilter")
    .value.toLowerCase();

  let filtered = students;

  // Filter by class
  if (classFilter) {
    filtered = filtered.filter((student) => student.class === classFilter);
  }

  // Filter by payment status
  if (paymentFilter) {
    filtered = filtered.filter((student) => {
      const paidMonths = student.payments.filter((p) => p).length;
      const totalMonths = student.payments.length;

      if (paymentFilter === "paid") return paidMonths === totalMonths;
      if (paymentFilter === "unpaid") return paidMonths === 0;
      if (paymentFilter === "partial")
        return paidMonths > 0 && paidMonths < totalMonths;
      return true;
    });
  }

  // Filter by search
  if (searchFilter) {
    filtered = filtered.filter((student) =>
      student.name.toLowerCase().includes(searchFilter),
    );
  }

  renderStudentsTable(filtered);
}

// Stats
function updateStats() {
  const totalStudents = students.length;
  const totalRevenue = students.reduce((sum, student) => {
    const paidMonths = student.payments.filter((p) => p).length;
    return sum + paidMonths * monthlyFee;
  }, 0);

  const totalDueAmount = students.reduce((sum, student) => {
    const unpaidMonths = student.payments.filter((p) => !p).length;
    return sum + unpaidMonths * monthlyFee;
  }, 0);

  const uniqueClasses = [...new Set(students.map((s) => s.class))].length;

  document.getElementById("totalStudents").textContent = totalStudents;
  document.getElementById("totalRevenue").textContent =
    `💵${totalRevenue.toFixed(2)}`;
  document.getElementById("unpaidAmount").textContent =
    `💵${totalDueAmount.toFixed(2)}`;
  document.getElementById("activeClasses").textContent =
    uniqueClasses || classes.length;
}

// Utility functions
function loadClassesToSelects(selectId = null) {
  const classSelects = selectId
    ? [document.getElementById(selectId)]
    : [
        document.getElementById("studentClass"),
        document.getElementById("editStudentClass"),
        document.getElementById("classFilter"),
      ];

  classSelects.forEach((select) => {
    if (!select) return;

    // Save current value
    const currentValue = select.value;

    // Clear and add options
    select.innerHTML = '<option value="">Select a class</option>';
    classes.forEach((className) => {
      const option = document.createElement("option");
      option.value = className;
      option.textContent = className;
      select.appendChild(option);
    });

    // Restore current value if it exists in options
    if (currentValue && classes.includes(currentValue)) {
      select.value = currentValue;
    }

    // For filter, add "All Classes" option
    if (select.id === "classFilter") {
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "All Classes";
      select.insertBefore(allOption, select.firstChild);
      select.value = currentValue || "";
    }
  });
}

function saveToLocalStorage() {
  localStorage.setItem("students", JSON.stringify(students));
  localStorage.setItem("classes", JSON.stringify(classes));
}

// Close modals when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    closeModal();
  }
};

function downloadLocalStorageAsJSON(filename = 'localStorage-backup.json') {
  if (!navigator.onLine) {
    alert('You must be online to download your data.');
    return;
  }

  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
