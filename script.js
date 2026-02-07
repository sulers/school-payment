// Data storage - Using your clean payment structure
let students = JSON.parse(localStorage.getItem("students")) || [];
let classes = JSON.parse(localStorage.getItem("classes")) || [];
let currentStudentId = null;
let importData = null;
let importOption = null;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  updateCurrentDate();
  renderTable();
  renderMonthlyStats();
  renderTotalEarnings();
  loadClassesToSelects();

  // Migrate old data if needed
  migrateOldData();
});

// Migrate old boolean payment data to new structure
function migrateOldData() {
  let migrated = false;

  students.forEach((student) => {
    if (
      student.payments &&
      student.payments.length > 0 &&
      typeof student.payments[0] === "boolean"
    ) {
      // Convert boolean array to object array
      student.payments = student.payments.map((isPaid) => ({
        paid: isPaid,
        amount: isPaid ? student.monthlyFee || 20000 : 0,
      }));
      migrated = true;
    }

    // Ensure we have 12 months
    if (!student.payments || student.payments.length < 12) {
      student.payments = Array.from({ length: 12 }, () => ({
        paid: false,
        amount: 0,
      }));
      migrated = true;
    }

    // Ensure monthlyFee exists
    if (!student.monthlyFee) {
      student.monthlyFee = 20000;
      migrated = true;
    }
  });

  if (migrated) {
    saveToLocalStorage();
    console.log("Data migrated to new payment structure");
  }
}

// Toast notification system from your mini version
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Student Management
function openAddStudentModal() {
  loadClassesToSelects();
  document.getElementById("studentName").value = "";
  document.getElementById("initialFee").value = "20000";
  openModal("addStudentModal");
}

function saveStudent() {
  const name = document.getElementById("studentName").value.trim();
  const className = document.getElementById("studentClass").value;
  const fee = parseFloat(document.getElementById("initialFee").value) || 20000;

  if (!name || !className) {
    showToast("Please fill in all fields");
    return;
  }

  students.push({
    id: Date.now(),
    name: name,
    class: className,
    monthlyFee: fee,
    payments: Array.from({ length: 12 }, () => ({ paid: false, amount: 0 })),
  });

  saveToLocalStorage();
  renderTable();
  renderMonthlyStats();
  renderTotalEarnings();

  closeModal("addStudentModal");
  showToast("Student Added");
}

// Class Management
function openAddClassModal() {
  document.getElementById("className").value = "";
  openModal("addClassModal");
}

function saveClass() {
  const className = document.getElementById("className").value.trim();

  if (!className) {
    showToast("Please enter a class name");
    return;
  }

  if (!classes.includes(className)) {
    classes.push(className);
    saveToLocalStorage();
    loadClassesToSelects();

    closeModal("addClassModal");
    showToast("Class Added");
  } else {
    showToast("Class already exists");
  }
}

// Table rendering (using your clean logic)
function renderTable(filteredStudents = null) {
  const tableBody = document.getElementById("studentsTableBody");
  const studentsToRender = filteredStudents || students;

  tableBody.innerHTML = "";

  if (studentsToRender.length === 0) {
    tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px;">
                            No students found. Add your first student!
                        </td>
                    </tr>
                `;
    return;
  }

  studentsToRender.forEach((student) => {
    const paidMonths = student.payments.filter((p) => p.paid).length;
    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
    const status =
      paidMonths === 0 ? "unpaid" : paidMonths === 12 ? "paid" : "partial";

    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>💵${student.monthlyFee.toFixed(2)}</td>
                    <td>${paidMonths}/12</td>
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

// Monthly stats (using your clean logic)
function renderMonthlyStats() {
  const monthlyStats = document.getElementById("monthlyStats");
  const earnings = new Array(12).fill(0);

  students.forEach((student) => {
    student.payments.forEach((p, i) => {
      if (p.paid) earnings[i] += p.amount;
    });
  });

  monthlyStats.innerHTML = "";
  earnings.forEach((amt, i) => {
    monthlyStats.innerHTML += `
                <div class="stat-card">
                    <h3>${months[i]}</h3>
                    <div class="value">💵${amt.toFixed(2)}</div>
                </div>`;
  });
}

// Total earnings
function renderTotalEarnings() {
  let total = 0;
  students.forEach((student) => {
    student.payments.forEach((p) => {
      if (p.paid) total += p.amount;
    });
  });
  document.getElementById("totalEarnings").innerHTML =
    `<strong>Total Collected: 💵${total.toFixed(2)}</strong>`;
}

// View Student (using your clean logic)
function viewStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;

  currentStudentId = id;
  document.getElementById("modalTitle").textContent = student.name;
  document.getElementById("modalStudentName").textContent = student.name;
  document.getElementById("modalStudentClass").textContent = student.class;
  document.getElementById("studentMonthlyFee").value = student.monthlyFee;

  // Calculate total paid
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  document.getElementById("modalTotalPaid").textContent =
    `💵${totalPaid.toFixed(2)}`;

  // Render month grid
  const monthGrid = document.getElementById("monthGrid");
  monthGrid.innerHTML = "";

  student.payments.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = `month-box ${p.paid ? "paid" : "unpaid"}`;
    div.innerHTML = `${months[i]}<br>${p.paid ? `Paid: 💵${p.amount.toFixed(2)}` : "UNPAID"}`;
    div.onclick = () => togglePayment(i);
    monthGrid.appendChild(div);
  });

  openModal("studentModal");
}

function togglePayment(index) {
  const student = students.find((s) => s.id === currentStudentId);
  if (!student) return;

  const payment = student.payments[index];

  if (!payment.paid) {
    payment.paid = true;
    payment.amount = student.monthlyFee;
  } else {
    payment.paid = false;
    payment.amount = 0;
  }

  saveToLocalStorage();
  viewStudent(currentStudentId);
  renderTable();
  renderMonthlyStats();
  renderTotalEarnings();
}

function updateStudentFee() {
  const student = students.find((s) => s.id === currentStudentId);
  if (!student) return;

  const newFee = parseFloat(document.getElementById("studentMonthlyFee").value);
  if (isNaN(newFee) || newFee < 0) {
    showToast("Please enter a valid fee amount");
    return;
  }

  student.monthlyFee = newFee;
  saveToLocalStorage();
  viewStudent(currentStudentId);
  renderTable();
  renderMonthlyStats();
  renderTotalEarnings();

  showToast("Fee Updated (old paid months unchanged)");
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

function updateStudent() {
  const name = document.getElementById("editStudentName").value.trim();
  const className = document.getElementById("editStudentClass").value;

  if (!name || !className) {
    showToast("Please fill in all fields");
    return;
  }

  const studentIndex = students.findIndex((s) => s.id === currentStudentId);
  if (studentIndex !== -1) {
    students[studentIndex].name = name;
    students[studentIndex].class = className;
    saveToLocalStorage();
    renderTable();

    closeModal("editStudentModal");
    showToast("Student Updated");
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
    renderTable();
    renderMonthlyStats();
    renderTotalEarnings();

    closeModal("editStudentModal");
    showToast("Student Deleted");
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

  if (classFilter) {
    filtered = filtered.filter((student) => student.class === classFilter);
  }

  if (paymentFilter) {
    filtered = filtered.filter((student) => {
      const paidMonths = student.payments.filter((p) => p.paid).length;

      if (paymentFilter === "paid") return paidMonths === 12;
      if (paymentFilter === "unpaid") return paidMonths === 0;
      if (paymentFilter === "partial") return paidMonths > 0 && paidMonths < 12;
      return true;
    });
  }

  if (searchFilter) {
    filtered = filtered.filter((student) =>
      student.name.toLowerCase().includes(searchFilter),
    );
  }

  renderTable(filtered);
}

// Import/Export functions (kept from original)
function openImportModal() {
  resetImportModal();
  openModal("importModal");
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileInfo").style.display = "block";

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const jsonData = JSON.parse(e.target.result);
      validateAndPreview(jsonData, file.name);
    } catch (error) {
      showValidationError(
        "Invalid JSON file. Please select a valid backup file.",
      );
    }
  };
  reader.readAsText(file);
}

function validateAndPreview(jsonData, fileName) {
  const validationResult = document.getElementById("validationResult");
  validationResult.style.display = "block";

  if (!jsonData.metadata || !jsonData.metadata.appName) {
    showValidationError(
      "This does not appear to be a valid backup file from this system.",
    );
    return;
  }

  let dataTypes = [];
  if (jsonData.students) dataTypes.push(`${jsonData.students.length} students`);
  if (jsonData.classes) dataTypes.push(`${jsonData.classes.length} classes`);

  if (dataTypes.length === 0) {
    showValidationError("No valid data found in this backup file.");
    return;
  }

  showValidationSuccess(
    `✅ Valid backup file found! Contains: ${dataTypes.join(", ")}`,
  );

  importData = jsonData;
  showPreview(jsonData);
  document.getElementById("importOptions").style.display = "block";
}

function showValidationError(message) {
  const validationResult = document.getElementById("validationResult");
  validationResult.className = "validation-message validation-error";
  validationResult.innerHTML = `❌ ${message}`;
  validationResult.style.display = "block";

  document.getElementById("previewSection").style.display = "none";
  document.getElementById("importOptions").style.display = "none";
  document.getElementById("importButton").disabled = true;
}

function showValidationSuccess(message) {
  const validationResult = document.getElementById("validationResult");
  validationResult.className = "validation-message validation-success";
  validationResult.innerHTML = message;
  validationResult.style.display = "block";
}

function showPreview(data) {
  const previewContent = document.getElementById("previewContent");
  previewContent.innerHTML = "";

  if (data.students) {
    const studentsPreview = document.createElement("div");
    studentsPreview.className = "preview-item";
    studentsPreview.innerHTML = `<strong>Students:</strong> ${data.students.length} records`;
    previewContent.appendChild(studentsPreview);

    data.students.slice(0, 3).forEach((student) => {
      const paidMonths = student.payments
        ? student.payments.filter((p) => p.paid).length
        : 0;
      const studentFee = student.monthlyFee || 0;
      const studentPreview = document.createElement("div");
      studentPreview.className = "preview-item";
      studentPreview.innerHTML = `<div style="margin-left: 20px;">• ${student.name} - ${student.class} (Fee: 💵${studentFee}, ${paidMonths}/12 months paid)</div>`;
      previewContent.appendChild(studentPreview);
    });

    if (data.students.length > 3) {
      const morePreview = document.createElement("div");
      morePreview.className = "preview-item";
      morePreview.innerHTML = `<div style="margin-left: 20px; color: var(--gray);">... and ${data.students.length - 3} more</div>`;
      previewContent.appendChild(morePreview);
    }
  }
}

function selectImportOption(option) {
  importOption = option;

  document.querySelectorAll(".import-option").forEach((el) => {
    el.classList.remove("selected");
  });

  if (option === "replace") {
    document.getElementById("replaceOption").classList.add("selected");
  } else if (option === "merge") {
    document.getElementById("mergeOption").classList.add("selected");
  }

  document.getElementById("importButton").disabled = false;
}

function executeImport() {
  if (!importData || !importOption) {
    showToast("Please select a file and import option first.");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to ${importOption === "replace" ? "REPLACE ALL" : "MERGE"} data? This action cannot be undone.`,
    )
  ) {
    return;
  }

  try {
    if (importOption === "replace") {
      students = importData.students || [];
      classes = importData.classes || classes;
    } else if (importOption === "merge") {
      if (importData.students) {
        importData.students.forEach((importedStudent) => {
          const existingIndex = students.findIndex(
            (s) => s.id === importedStudent.id,
          );
          if (existingIndex !== -1) {
            students[existingIndex] = importedStudent;
          } else {
            students.push(importedStudent);
          }
        });
      }

      if (importData.classes) {
        importData.classes.forEach((className) => {
          if (!classes.includes(className)) {
            classes.push(className);
          }
        });
      }
    }

    // Migrate imported data if needed
    migrateOldData();
    saveToLocalStorage();
    loadClassesToSelects();
    renderTable();
    renderMonthlyStats();
    renderTotalEarnings();

    closeModal("importModal");
    showToast("Data imported successfully!");
  } catch (error) {
    showToast("Error importing data");
    console.error("Import error:", error);
  }
}

function exportData() {
  const format = document.getElementById("dataFormat").value;
  const includeStats = document.getElementById("includeStats").value === "true";

  let exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      appName: "School Payment Management System",
      version: "2.0",
    },
  };

  switch (format) {
    case "full":
      exportData.students = students;
      exportData.classes = classes;
      break;

    case "students":
      exportData.students = students;
      break;

    case "classes":
      exportData.classes = classes;
      break;

    case "summary":
      let totalPaid = 0;
      let monthlyEarnings = new Array(12).fill(0);

      students.forEach((student) => {
        student.payments.forEach((payment, monthIndex) => {
          if (payment.paid && monthIndex < 12) {
            totalPaid += payment.amount || 0;
            monthlyEarnings[monthIndex] += payment.amount || 0;
          }
        });
      });

      exportData.summary = {
        totalStudents: students.length,
        totalClasses: classes.length,
        totalPaid: totalPaid,
        monthlyEarnings: monthlyEarnings,
        generatedAt: new Date().toISOString(),
      };
      break;
  }

  if (includeStats) {
    const stats = calculateDetailedStats();
    exportData.statistics = stats;
  }

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `school-payments-${format}-${timestamp}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Data exported successfully!");
}

function calculateDetailedStats() {
  const totalStudents = students.length;
  let totalPaid = 0;
  let monthlyEarnings = new Array(12).fill(0);

  students.forEach((student) => {
    student.payments.forEach((payment, monthIndex) => {
      if (payment.paid && monthIndex < 12) {
        totalPaid += payment.amount || 0;
        monthlyEarnings[monthIndex] += payment.amount || 0;
      }
    });
  });

  return {
    totalStudents: totalStudents,
    totalClasses: classes.length,
    totalPaid: totalPaid,
    monthlyEarnings: monthlyEarnings,
    generatedAt: new Date().toISOString(),
  };
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

    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a class</option>';
    classes.forEach((className) => {
      const option = document.createElement("option");
      option.value = className;
      option.textContent = className;
      select.appendChild(option);
    });

    if (currentValue && classes.includes(currentValue)) {
      select.value = currentValue;
    }

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

function updateCurrentDate() {
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  document.getElementById("currentDate").textContent =
    `Today: ${now.toLocaleDateString("en-US", options)}`;
}

function resetImportModal() {
  importData = null;
  importOption = null;
  document.getElementById("fileInput").value = "";
  document.getElementById("fileInfo").style.display = "none";
  document.getElementById("validationResult").style.display = "none";
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("importOptions").style.display = "none";
  document.getElementById("importButton").disabled = true;

  document.querySelectorAll(".import-option").forEach((option) => {
    option.classList.remove("selected");
  });
}

// Close modals when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};
