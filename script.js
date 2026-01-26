// Data storage
let students = JSON.parse(localStorage.getItem("students")) || [];
let classes = JSON.parse(localStorage.getItem("classes")) || [];
let monthlyFee = parseFloat(localStorage.getItem("monthlyFee")) || 20000;
let currentYear =
  parseInt(localStorage.getItem("currentYear")) || new Date().getFullYear();
let currentStudentId = null;
let importData = null;
let importOption = null;

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  updateCurrentDate();
  updateStats();
  loadClassesToSelects();
  renderStudentsTable();
  updateMonthlyFeeDisplay();
  updateCurrentYearDisplay();

  // Migrate existing students to have 12 months if they don't
  migrateStudentsTo12Months();

  // Setup drag and drop for import
  setupDragAndDrop();
});

// Setup drag and drop
function setupDragAndDrop() {
  const dropArea = document.getElementById("fileUploadArea");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropArea.style.borderColor = "var(--primary)";
    dropArea.style.backgroundColor = "rgba(37, 99, 235, 0.1)";
  }

  function unhighlight() {
    dropArea.style.borderColor = "var(--gray-light)";
    dropArea.style.backgroundColor = "";
  }

  dropArea.addEventListener("drop", handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      handleFileSelect({ target: { files: files } });
    }
  }
}

// Import Modal Functions
function openImportModal() {
  resetImportModal();
  openModal("importModal");
}

function closeImportModal() {
  closeModal("importModal");
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

  // Reset option selection
  document.querySelectorAll(".import-option").forEach((option) => {
    option.classList.remove("selected");
  });
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

  // Check if it's a valid backup file
  if (!jsonData.metadata || !jsonData.metadata.appName) {
    showValidationError(
      "This does not appear to be a valid backup file from this system.",
    );
    return;
  }

  if (jsonData.metadata.appName !== "School Payment Management System") {
    showValidationError("This backup file is from a different system.");
    return;
  }

  // Check what data is available
  let dataTypes = [];
  if (jsonData.students) dataTypes.push(`${jsonData.students.length} students`);
  if (jsonData.classes) dataTypes.push(`${jsonData.classes.length} classes`);
  if (jsonData.setup) dataTypes.push("setup data");
  if (jsonData.summary) dataTypes.push("summary data");

  if (dataTypes.length === 0) {
    showValidationError("No valid data found in this backup file.");
    return;
  }

  showValidationSuccess(
    `✅ Valid backup file found! Contains: ${dataTypes.join(", ")}`,
  );

  importData = jsonData;

  // Show preview
  showPreview(jsonData);

  // Show import options
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

    // Show first 3 students as sample
    data.students.slice(0, 3).forEach((student) => {
      const paidMonths = student.payments
        ? student.payments.filter((p) => p).length
        : 0;
      const studentPreview = document.createElement("div");
      studentPreview.className = "preview-item";
      studentPreview.innerHTML = `<div style="margin-left: 20px;">• ${student.name} - ${student.class} (${paidMonths}/12 months paid)</div>`;
      previewContent.appendChild(studentPreview);
    });

    if (data.students.length > 3) {
      const morePreview = document.createElement("div");
      morePreview.className = "preview-item";
      morePreview.innerHTML = `<div style="margin-left: 20px; color: var(--gray);">... and ${data.students.length - 3} more</div>`;
      previewContent.appendChild(morePreview);
    }
  }

  if (data.classes) {
    const classesPreview = document.createElement("div");
    classesPreview.className = "preview-item";
    classesPreview.innerHTML = `<strong>Classes:</strong> ${data.classes.length} classes`;
    previewContent.appendChild(classesPreview);

    // Show classes
    data.classes.slice(0, 5).forEach((className) => {
      const classPreview = document.createElement("div");
      classPreview.className = "preview-item";
      classPreview.innerHTML = `<div style="margin-left: 20px;">• ${className}</div>`;
      previewContent.appendChild(classPreview);
    });

    if (data.classes.length > 5) {
      const morePreview = document.createElement("div");
      morePreview.className = "preview-item";
      morePreview.innerHTML = `<div style="margin-left: 20px; color: var(--gray);">... and ${data.classes.length - 5} more</div>`;
      previewContent.appendChild(morePreview);
    }
  }

  if (data.setup) {
    const setupPreview = document.createElement("div");
    setupPreview.className = "preview-item";
    setupPreview.innerHTML = `<strong>Setup:</strong> Fee: 💵${data.setup.monthlyFee || "N/A"}, Year: ${data.setup.currentYear || "N/A"}`;
    previewContent.appendChild(setupPreview);
  }

  if (data.metadata) {
    const metaPreview = document.createElement("div");
    metaPreview.className = "preview-item";
    const exportDate = new Date(data.metadata.exportDate).toLocaleString();
    metaPreview.innerHTML = `<strong>Backup Info:</strong> Exported on ${exportDate}`;
    previewContent.appendChild(metaPreview);
  }

  document.getElementById("previewSection").style.display = "block";
}

function selectImportOption(option) {
  importOption = option;

  // Update UI
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
    alert("Please select a file and import option first.");
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
      // Replace all data
      students = importData.students || [];
      classes = importData.classes || classes;

      if (importData.setup) {
        monthlyFee = importData.setup.monthlyFee || monthlyFee;
        currentYear = importData.setup.currentYear || currentYear;
        localStorage.setItem("monthlyFee", monthlyFee);
        localStorage.setItem("currentYear", currentYear);
      }
    } else if (importOption === "merge") {
      // Merge data
      if (importData.students) {
        // Merge students by ID
        importData.students.forEach((importedStudent) => {
          const existingIndex = students.findIndex(
            (s) => s.id === importedStudent.id,
          );
          if (existingIndex !== -1) {
            // Update existing student
            students[existingIndex] = importedStudent;
          } else {
            // Add new student
            students.push(importedStudent);
          }
        });
      }

      if (importData.classes) {
        // Merge classes
        importData.classes.forEach((className) => {
          if (!classes.includes(className)) {
            classes.push(className);
          }
        });
      }

      if (importData.setup) {
        // Update setup if provided
        if (importData.setup.monthlyFee) {
          monthlyFee = importData.setup.monthlyFee;
          localStorage.setItem("monthlyFee", monthlyFee);
        }
        if (importData.setup.currentYear) {
          currentYear = importData.setup.currentYear;
          localStorage.setItem("currentYear", currentYear);
        }
      }
    }

    // Save to localStorage
    saveToLocalStorage();

    // Update UI
    updateStats();
    loadClassesToSelects();
    renderStudentsTable();
    updateMonthlyFeeDisplay();
    updateCurrentYearDisplay();

    // Show success message
    alert(
      `✅ Data imported successfully!\n\n• Students: ${students.length}\n• Classes: ${classes.length}\n• Monthly Fee: 💵${monthlyFee}\n• Year: ${currentYear}`,
    );

    // Close modal
    closeImportModal();
  } catch (error) {
    alert("❌ Error importing data: " + error.message);
    console.error("Import error:", error);
  }
}

// Migrate existing students to 12 months
function migrateStudentsTo12Months() {
  let migrated = false;
  students.forEach((student) => {
    if (student.payments.length < 12) {
      // Add false values for remaining months
      while (student.payments.length < 12) {
        student.payments.push(false);
      }
      migrated = true;
    }
  });

  if (migrated) {
    saveToLocalStorage();
    console.log("Migrated students to 12-month tracking");
  }
}

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

function updateCurrentYearDisplay() {
  document.getElementById("currentYearDisplay").textContent =
    `Year: ${currentYear}`;
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
    payments: Array(12).fill(false), // All 12 months
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  updateCurrentYearDisplay();
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
    const totalMonths = 12; // Always 12 months now
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

// View Student Details - Shows ALL 12 months
function viewStudent(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  currentStudentId = studentId;

  const paidMonths = student.payments.filter((p) => p).length;
  const totalMonths = 12; // Always 12 months now
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

  // Render ALL 12 months
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

  for (let i = 0; i < 12; i++) {
    const monthBox = document.createElement("div");
    monthBox.className = `month-box ${student.payments[i] ? "paid" : "unpaid"}`;
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

  // No restriction - can pay for any month in any order
  student.payments[monthIndex] = !student.payments[monthIndex];
  student.updatedAt = new Date().toISOString();
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
    students[studentIndex].updatedAt = new Date().toISOString();
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
      const totalMonths = 12; // Always 12 months now

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
    const unpaidMonths = 12 - student.payments.filter((p) => p).length; // 12 total months
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

// EXPORT DATA FUNCTIONALITY
function exportData() {
  const format = document.getElementById("dataFormat").value;
  const includeStats = document.getElementById("includeStats").value === "true";

  let exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      appName: "School Payment Management System",
      version: "1.0",
      currentYear: currentYear,
      monthlyFee: monthlyFee,
    },
  };

  // Add data based on selected format
  switch (format) {
    case "full":
      exportData.students = students;
      exportData.classes = classes;
      exportData.setup = {
        monthlyFee: monthlyFee,
        currentYear: currentYear,
      };
      break;

    case "students":
      exportData.students = students;
      break;

    case "classes":
      exportData.classes = classes;
      break;

    case "summary":
      const paidMonths = students.reduce(
        (sum, student) => sum + student.payments.filter((p) => p).length,
        0,
      );
      const totalMonths = students.length * 12;

      exportData.summary = {
        totalStudents: students.length,
        totalClasses: classes.length,
        totalPaidMonths: paidMonths,
        totalUnpaidMonths: totalMonths - paidMonths,
        totalRevenue: paidMonths * monthlyFee,
        totalDue: (totalMonths - paidMonths) * monthlyFee,
        monthlyFee: monthlyFee,
        currentYear: currentYear,
      };
      break;
  }

  // Add statistics if requested
  if (includeStats) {
    const stats = calculateDetailedStats();
    exportData.statistics = stats;
  }

  // Create and download JSON file
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

  alert(`✅ Data exported successfully!\nFile: ${filename}`);
}

function calculateDetailedStats() {
  const totalStudents = students.length;
  let paidMonths = 0;
  let totalRevenue = 0;
  let classStats = {};

  students.forEach((student) => {
    const studentPaidMonths = student.payments.filter((p) => p).length;
    paidMonths += studentPaidMonths;
    totalRevenue += studentPaidMonths * monthlyFee;

    // Track class statistics
    if (!classStats[student.class]) {
      classStats[student.class] = {
        count: 0,
        paidMonths: 0,
        students: [],
      };
    }
    classStats[student.class].count++;
    classStats[student.class].paidMonths += studentPaidMonths;
    classStats[student.class].students.push(student.name);
  });

  const totalMonths = totalStudents * 12;
  const unpaidMonths = totalMonths - paidMonths;

  return {
    totalStudents: totalStudents,
    totalClasses: classes.length,
    paidMonths: paidMonths,
    unpaidMonths: unpaidMonths,
    totalRevenue: totalRevenue,
    totalDue: unpaidMonths * monthlyFee,
    paymentRate:
      totalMonths > 0
        ? ((paidMonths / totalMonths) * 100).toFixed(2) + "%"
        : "0%",
    classStatistics: classStats,
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

// Quick data backup reminder
setInterval(
  () => {
    // Remind to export data every hour
    const lastExport = localStorage.getItem("lastExportReminder");
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (!lastExport || now - parseInt(lastExport) > oneHour) {
      console.log("💡 Remember to export your data regularly for backup!");
      localStorage.setItem("lastExportReminder", now.toString());
    }
  },
  1000 * 60 * 60,
); // Check every hour
