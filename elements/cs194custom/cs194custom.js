document.addEventListener("DOMContentLoaded", function() {

  // --- Utility Functions ---
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Sample table data to show in results
  // THIS WILL BE FETECHED FROM SERVER.PY (I THINK!!)
  const sampleTables = {
    // For question about orders pivot
    orders: {
      columns: ["order_id", "customer_id", "order_date", "total_amount", "status"],
      values: [
        [101, 1, "2023-01-10", 1349.98, "Delivered"],
        [102, 2, "2023-01-15", 899.99, "Delivered"],
        [103, 3, "2023-02-05", 279.98, "Shipped"]
      ]
    },
    orders2: {
      columns: ["status", "count"],
      values: [
        ["Pending", 5],
        ["Processing", 3],
        ["Shipped", 4],
        ["Delivered", 10]
      ]
    },
    orders3: {
      columns: ["status", "count"],
      values: [
        ["Pending", 2],
        ["Processing", 6],
        ["Shipped", 7],
        ["Delivered", 8]
      ]
    },
    orders4: {
      columns: ["status", "count"],
      values: [
        ["Pending", 1],
        ["Processing", 4],
        ["Shipped", 9],
        ["Delivered", 12]
      ]
    },
    // For question about customers selection
    customers: {
      columns: ["customer_id", "name", "email", "country"],
      values: [
        [1, "Alice", "alice@example.com", "USA"],
        [2, "Bob", "bob@example.com", "USA"],
        [3, "Charlie", "charlie@example.com", "USA"]
      ]
    },
    customers2: {
      columns: ["customer_id", "name", "email", "country"],
      values: [
        [1, "Alice", "alice@example.com", "United States"],
        [2, "Bob", "bob@example.com", "United States"],
        [3, "Charlie", "charlie@example.com", "United States"]
      ]
    },
    customers3: {
      columns: ["customer_id", "name", "email", "country"],
      values: [
        [1, "Alice", "alice@example.com", "The USA"],
        [2, "Bob", "bob@example.com", "The USA"],
        [3, "Charlie", "charlie@example.com", "The USA"]
      ]
    },
    customers4: {
      columns: ["customer_id", "name", "email", "state"],
      values: [
        [1, "Alice", "alice@example.com", "NY"],
        [2, "Bob", "bob@example.com", "CA"],
        [3, "Charlie", "charlie@example.com", "IL"]
      ]
    }
  };

  function displaySampleTable(tableName) {
    const resultsContent = document.getElementById("results-content");
    const data = sampleTables[tableName];
    if (!data) return;

    let html = `<table class="table table-bordered table-sm"><thead><tr>`;
    data.columns.forEach(col => html += `<th>${col}</th>`);
    html += `</tr></thead><tbody>`;
    data.values.forEach(row => {
      html += `<tr>`;
      row.forEach(cell => html += `<td>${cell}</td>`);
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    resultsContent.innerHTML = html;
  }

  /****************************************************************
   * 1) QUIZ LOGIC WITH MULTIPLE QUESTIONS
   ****************************************************************/

  // Sample questions array with options that include sampleTable property
  const questions = [
    {
      question: "Pivot Query: Count orders by status.",
      // Options are objects with text and the corresponding sampleTable key.
      options: [
        {
          text: "SELECT COUNT(CASE WHEN status = 'Pending' THEN 1 END) as Pending,\nCOUNT(CASE WHEN status = 'Processing' THEN 1 END) as Processing,\nCOUNT(CASE WHEN status = 'Shipped' THEN 1 END) as Shipped,\nCOUNT(CASE WHEN status = 'Delivered' THEN 1 END) as Delivered\nFROM orders;",
          sampleTable: "orders"
        },
        {
          text: "SELECT status, COUNT(*) FROM orders GROUP BY status;",
          sampleTable: "orders2"
        },
        {
          text: "SELECT PIVOT(COUNT(*) FOR status IN ('Pending','Processing','Shipped','Delivered')) FROM orders;",
          sampleTable: "orders3"
        },
        {
          text: "SELECT * FROM orders PIVOT(COUNT(*) FOR status IN (Pending,Processing,Shipped,Delivered));",
          sampleTable: "orders4"
        }
      ],
      correctIndex: 0
    },
    {
      question: "Simple Selection: List customers from USA.",
      options: [
        {
          text: "SELECT * FROM customers WHERE country = 'USA';",
          sampleTable: "customers"
        },
        {
          text: "SELECT * FROM customers WHERE country = 'United States';",
          sampleTable: "customers2"
        },
        {
          text: "SELECT * FROM customers WHERE country LIKE '%USA%';",
          sampleTable: "customers3"
        },
        {
          text: "SELECT * FROM customers WHERE state IN ('NY','CA','IL');",
          sampleTable: "customers4"
        }
      ],
      correctIndex: 0
    }
  ];

  // Randomize questions order
  shuffleArray(questions);
  let currentQuestionIndex = 0;
  let userAnswers = new Array(questions.length).fill(null);

  const questionTitleElem = document.querySelector(".question-title");
  const questionCounterElem = document.querySelector(".question-counter");
  const questionContentElem = document.getElementById("question-content");
  const checkAnswerBtn = document.getElementById("check-answer-btn");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const progressBar = document.getElementById("progress-bar");

  // Dynamically render the current question
  function displayQuestion() {
    // Clear previous content and reset userChoice for current question
    questionContentElem.innerHTML = "";
    let currentQ = questions[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = null;

    // Update header
    questionTitleElem.textContent = currentQ.question;
    questionCounterElem.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;

    // Build multiple-choice options dynamically
    currentQ.options.forEach((option, idx) => {
      const choiceDiv = document.createElement("div");
      choiceDiv.classList.add("choice-option");
      choiceDiv.dataset.index = idx;
      // Use <pre> to preserve formatting (if desired)
      choiceDiv.innerHTML = `<pre>${option.text}</pre>`;
      choiceDiv.addEventListener("click", function(e) {
        e.preventDefault();
        // Clear previous selection
        const allOptions = questionContentElem.querySelectorAll(".choice-option");
        allOptions.forEach(opt => opt.classList.remove("selected"));
        this.classList.add("selected");
        // Save user choice
        userAnswers[currentQuestionIndex] = idx;
        // Immediately display the corresponding sample table
        displaySampleTable(option.sampleTable);
      });
      questionContentElem.appendChild(choiceDiv);
    });

    // Reset the check answer button
    checkAnswerBtn.disabled = false;
    // Reset progress bar based on current question
    progressBar.style.width = `${Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%`;
  }

  // Check the answer when user clicks the button
  checkAnswerBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const currentQ = questions[currentQuestionIndex];
    let userChoice = userAnswers[currentQuestionIndex];
    if (userChoice === null) {
      showToast("Please select an answer first.", "warning");
      return;
    }
    const options = questionContentElem.querySelectorAll(".choice-option");
    // Mark the correct answer in green and the chosen (if incorrect) in red.
    options.forEach((opt, idx) => {
      if (idx === currentQ.correctIndex) {
        opt.classList.add("correct");
      } else if (idx === userChoice && userChoice !== currentQ.correctIndex) {
        opt.classList.add("incorrect");
      }
    });
    checkAnswerBtn.disabled = true;
    showToast(userChoice === currentQ.correctIndex ? "Correct answer!" : "Incorrect answer.", 
              userChoice === currentQ.correctIndex ? "success" : "danger");
  });

  nextBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion();
    }
  });

  prevBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion();
    }
  });

  // Initially display first question
  displayQuestion();

  /****************************************************************
   * 2) TOGGLE SQL BUILDER
   ****************************************************************/
  const toggleBuilderBtn = document.getElementById("toggle-builder");
  const sqlBuilderSection = document.getElementById("sql-builder-section");

  toggleBuilderBtn.addEventListener("click", function(e) {
    e.preventDefault();
    sqlBuilderSection.style.display = (sqlBuilderSection.style.display === "none" || sqlBuilderSection.style.display === "")
      ? "block" : "none";
  });

  /****************************************************************
   * 3) SIMPLE SQL BUILDER LOGIC
   ****************************************************************/
  const selectTableElem = document.getElementById("select-table");
  const selectColumnsElem = document.getElementById("select-columns");
  const joinTypeElem = document.getElementById("join-type");
  const joinTableElem = document.getElementById("join-table");
  const joinConditionElem = document.getElementById("join-condition");
  const whereConditionElem = document.getElementById("where-condition");
  const orderColumnElem = document.getElementById("order-column");
  const orderDirectionElem = document.getElementById("order-direction");
  const sqlPreviewElem = document.getElementById("sql-preview");
  const resetBuilderBtn = document.getElementById("reset-builder");
  const runBuilderQueryBtn = document.getElementById("run-builder-query");

  // Example table/columns for SQL builder
  const tablesData = {
    orders: ["order_id", "customer_id", "order_date", "total_amount", "status"]
  };

  function populateTables() {
    Object.keys(tablesData).forEach(tbl => {
      const option1 = document.createElement("option");
      option1.value = tbl;
      option1.textContent = tbl;
      selectTableElem.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = tbl;
      option2.textContent = tbl;
      joinTableElem.appendChild(option2);
    });
  }
  populateTables();

  function renderColumns(tableName) {
    selectColumnsElem.innerHTML = "";
    if (!tableName) return;
    tablesData[tableName].forEach(col => {
      const colDiv = document.createElement("div");
      colDiv.classList.add("column-option");
      colDiv.textContent = col;
      colDiv.addEventListener("click", () => {
        colDiv.classList.toggle("selected");
        updateSQLPreview();
      });
      selectColumnsElem.appendChild(colDiv);
    });
  }

  selectTableElem.addEventListener("change", function(e) {
    e.preventDefault();
    renderColumns(selectTableElem.value);
    updateSQLPreview();
  });

  joinTypeElem.addEventListener("change", updateSQLPreview);
  joinTableElem.addEventListener("change", updateSQLPreview);
  joinConditionElem.addEventListener("input", updateSQLPreview);
  whereConditionElem.addEventListener("input", updateSQLPreview);
  orderColumnElem.addEventListener("input", updateSQLPreview);
  orderDirectionElem.addEventListener("change", updateSQLPreview);

  function updateSQLPreview() {
    const mainTable = selectTableElem.value;
    if (!mainTable) {
      sqlPreviewElem.textContent = "SELECT * FROM table";
      return;
    }
    const selectedCols = [];
    selectColumnsElem.querySelectorAll(".column-option.selected").forEach(colDiv => {
      selectedCols.push(colDiv.textContent);
    });
    const columnsPart = selectedCols.length > 0 ? selectedCols.join(", ") : "*";
    let sql = `SELECT ${columnsPart} FROM ${mainTable}`;
    if (joinTableElem.value && joinConditionElem.value) {
      sql += ` ${joinTypeElem.value} ${joinTableElem.value} ON ${joinConditionElem.value}`;
    }
    if (whereConditionElem.value) {
      sql += ` WHERE ${whereConditionElem.value}`;
    }
    if (orderColumnElem.value) {
      sql += ` ORDER BY ${orderColumnElem.value} ${orderDirectionElem.value}`;
    }
    sqlPreviewElem.textContent = sql;
  }

  resetBuilderBtn.addEventListener("click", function(e) {
    e.preventDefault();
    selectTableElem.value = "";
    selectColumnsElem.innerHTML = "";
    joinTypeElem.value = "INNER JOIN";
    joinTableElem.value = "";
    joinConditionElem.value = "";
    whereConditionElem.value = "";
    orderColumnElem.value = "";
    orderDirectionElem.value = "ASC";
    sqlPreviewElem.textContent = "SELECT * FROM table";
  });

  runBuilderQueryBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const finalSQL = sqlPreviewElem.textContent;
    resultsContent.innerHTML = `
      <div class="alert alert-success">Running query: <strong>${finalSQL}</strong></div>
    `;
  });

  /****************************************************************
   * 4) RESET QUIZ BUTTON
   ****************************************************************/
  const resetQuizBtn = document.getElementById("reset-quiz");
  resetQuizBtn.addEventListener("click", function(e) {
    e.preventDefault();
    // Reset quiz state and re-display the first question
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    displayQuestion();
    progressBar.style.width = `${Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%`;
  });

  /****************************************************************
   * 5) SIMPLE TOAST UTILITY
   ****************************************************************/
  function showToast(message, type = "info") {
    alert(`[${type.toUpperCase()}] ${message}`);
  }
});
