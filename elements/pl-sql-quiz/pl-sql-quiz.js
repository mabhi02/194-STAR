// Initialize the SQL Quiz when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Find all SQL Quiz elements on the page
    document.querySelectorAll('[id^="pl-sql-quiz-"]').forEach(function(quizElement) {
        const uuid = quizElement.id.replace('pl-sql-quiz-', '');
        
        // Initialize Quiz if it's a question panel
        if (document.getElementById(`pl-sql-quiz-input-${uuid}`)) {
            initializeSQLQuiz(uuid);
        }
    });
});

// Toast notification function
function showToast(uuid, message, type = 'info') {
    const containerId = `pl-sql-toast-container-${uuid}`;
    let container = document.getElementById(containerId);
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast show';
    
    // Different icon and color based on type
    let iconClass = 'fa-info-circle';
    let headerClass = 'bg-info';
    
    if (type === 'success') {
        iconClass = 'fa-check-circle';
        headerClass = 'bg-success';
    } else if (type === 'warning') {
        iconClass = 'fa-exclamation-triangle';
        headerClass = 'bg-warning';
    } else if (type === 'danger') {
        iconClass = 'fa-times-circle';
        headerClass = 'bg-danger';
    }
    
    toast.innerHTML = `
        <div class="toast-header ${headerClass} text-white">
            <strong class="me-auto">
                <i class="fa ${iconClass} me-2"></i>
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </strong>
            <button type="button" class="btn-close btn-close-white" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 500);
    }, 5000);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 500);
        });
    }
}

// Main SQL Quiz initialization function
function initializeSQLQuiz(uuid) {
    // Load SQL.js
    initSqlJs({ 
        locateFile: file => `${window.PLConfig.clientFilesCourseUrl}/sql.js/${file}`
    }).then(SQL => {
        // Create SQLQuizApp instance
        const quizApp = new SQLQuizApp(uuid, SQL);
        quizApp.initialize();
        
        // Initialize query builder if it exists
        if (document.getElementById(`pl-sql-builder-${uuid}`)) {
            const builder = new SQLQueryBuilder(uuid, quizApp);
            builder.initialize();
        }
    }).catch(err => {
        console.error('Error initializing SQL database:', err);
        showToast(uuid, 'Error initializing SQL database: ' + err.message, 'danger');
    });
}

// SQLQueryBuilder class
class SQLQueryBuilder {
    constructor(uuid, quizApp) {
        this.uuid = uuid;
        this.quizApp = quizApp;
        this.selectedTable = '';
        this.selectedColumns = [];
        this.joinType = 'INNER JOIN';
        this.joinTable = '';
        this.joinCondition = '';
        this.whereCondition = '';
        this.orderColumn = '';
        this.orderDirection = 'ASC';
        
        // Builder elements
        this.builderSection = document.getElementById(`pl-sql-builder-${uuid}`);
        this.toggleBtn = document.getElementById(`pl-sql-builder-toggle-${uuid}`);
        this.builderContent = document.getElementById(`pl-sql-builder-content-${uuid}`);
        this.resetBtn = document.getElementById(`pl-sql-builder-reset-${uuid}`);
        this.runBtn = document.getElementById(`pl-sql-builder-run-${uuid}`);
        
        // SELECT tab elements
        this.selectTableEl = document.getElementById(`pl-sql-select-table-${uuid}`);
        this.selectColumnsEl = document.getElementById(`pl-sql-select-columns-${uuid}`);
        
        // JOIN tab elements
        this.joinTypeEl = document.getElementById(`pl-sql-join-type-${uuid}`);
        this.joinTableEl = document.getElementById(`pl-sql-join-table-${uuid}`);
        this.joinConditionEl = document.getElementById(`pl-sql-join-condition-${uuid}`);
        
        // WHERE tab elements
        this.whereConditionEl = document.getElementById(`pl-sql-where-condition-${uuid}`);
        
        // ORDER BY tab elements
        this.orderColumnEl = document.getElementById(`pl-sql-order-column-${uuid}`);
        this.orderDirectionEl = document.getElementById(`pl-sql-order-direction-${uuid}`);
        
        // SQL preview element
        this.sqlPreviewEl = document.getElementById(`pl-sql-preview-${uuid}`);
    }
    
    initialize() {
        // Show builder section
        this.builderSection.style.display = 'block';
        
        // Toggle builder visibility
        this.toggleBtn.addEventListener('click', () => {
            if (this.builderContent.style.display === 'none') {
                this.builderContent.style.display = 'block';
                this.toggleBtn.innerHTML = '<i class="fa fa-minus"></i>';
            } else {
                this.builderContent.style.display = 'none';
                this.toggleBtn.innerHTML = '<i class="fa fa-plus"></i>';
            }
        });
        
        // Reset builder
        this.resetBtn.addEventListener('click', () => {
            this.resetBuilder();
        });
        
        // Run query
        this.runBtn.addEventListener('click', () => {
            this.runQuery();
        });
        
        // Add event listeners for form controls
        this.selectTableEl.addEventListener('change', () => {
            this.selectedTable = this.selectTableEl.value;
            this.populateColumns();
            this.updateSqlPreview();
        });
        
        this.joinTypeEl.addEventListener('change', () => {
            this.joinType = this.joinTypeEl.value;
            this.updateSqlPreview();
        });
        
        this.joinTableEl.addEventListener('change', () => {
            this.joinTable = this.joinTableEl.value;
            this.updateSqlPreview();
        });
        
        this.joinConditionEl.addEventListener('input', () => {
            this.joinCondition = this.joinConditionEl.value;
            this.updateSqlPreview();
        });
        
        this.whereConditionEl.addEventListener('input', () => {
            this.whereCondition = this.whereConditionEl.value;
            this.updateSqlPreview();
        });
        
        this.orderColumnEl.addEventListener('input', () => {
            this.orderColumn = this.orderColumnEl.value;
            this.updateSqlPreview();
        });
        
        this.orderDirectionEl.addEventListener('change', () => {
            this.orderDirection = this.orderDirectionEl.value;
            this.updateSqlPreview();
        });
        
        // Populate tables from database
        this.populateTables();
    }
    
    populateTables() {
        // Clear existing options
        this.selectTableEl.innerHTML = '<option value="">-- Select a table --</option>';
        this.joinTableEl.innerHTML = '<option value="">-- Select a table --</option>';
        
        // Get tables from the database
        try {
            const tables = this.quizApp.db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values;
            
            // Add options for each table
            tables.forEach(table => {
                const tableName = table[0];
                
                // Add to SELECT table dropdown
                const selectOption = document.createElement('option');
                selectOption.value = tableName;
                selectOption.textContent = tableName;
                this.selectTableEl.appendChild(selectOption);
                
                // Add to JOIN table dropdown
                const joinOption = document.createElement('option');
                joinOption.value = tableName;
                joinOption.textContent = tableName;
                this.joinTableEl.appendChild(joinOption);
            });
        } catch (error) {
            console.error('Error fetching tables:', error);
            showToast(this.uuid, 'Error fetching database tables: ' + error.message, 'danger');
        }
    }
    
    populateColumns() {
        // Clear existing columns
        this.selectColumnsEl.innerHTML = '';
        this.selectedColumns = [];
        
        if (!this.selectedTable) return;
        
        // Get columns for the selected table
        try {
            const pragma = this.quizApp.db.exec(`PRAGMA table_info(${this.selectedTable})`)[0];
            
            // Create a clickable option for each column
            pragma.values.forEach(col => {
                const colName = col[1];
                const colType = col[2];
                
                // Create column option element
                const columnEl = document.createElement('div');
                columnEl.className = 'column-option';
                columnEl.dataset.column = colName;
                columnEl.textContent = colName;
                
                // Add click event to toggle selection
                columnEl.addEventListener('click', () => {
                    columnEl.classList.toggle('selected');
                    
                    if (columnEl.classList.contains('selected')) {
                        if (this.selectedTable) {
                            this.selectedColumns.push(`${this.selectedTable}.${colName}`);
                        } else {
                            this.selectedColumns.push(colName);
                        }
                    } else {
                        this.selectedColumns = this.selectedColumns.filter(
                            col => {
                                if (this.selectedTable) {
                                    return col !== `${this.selectedTable}.${colName}`;
                                } else {
                                    return col !== colName;
                                }
                            }
                        );
                    }
                    
                    this.updateSqlPreview();
                });
                
                this.selectColumnsEl.appendChild(columnEl);
            });
        } catch (error) {
            console.error('Error fetching columns:', error);
            showToast(this.uuid, 'Error fetching table columns: ' + error.message, 'danger');
        }
    }
    
    updateSqlPreview() {
        let sql = 'SELECT ';
        
        // Add columns
        if (this.selectedColumns.length > 0) {
            sql += this.selectedColumns.join(', ');
        } else {
            sql += '*';
        }
        
        // Add FROM clause
        if (this.selectedTable) {
            sql += ` FROM ${this.selectedTable}`;
        } else {
            sql += ' FROM table';
        }
        
        // Add JOIN clause
        if (this.joinTable && this.joinCondition) {
            sql += `\n${this.joinType} ${this.joinTable} ON ${this.joinCondition}`;
        }
        
        // Add WHERE clause
        if (this.whereCondition) {
            sql += `\nWHERE ${this.whereCondition}`;
        }
        
        // Add ORDER BY clause
        if (this.orderColumn) {
            sql += `\nORDER BY ${this.orderColumn} ${this.orderDirection}`;
        }
        
        // Update SQL preview
        this.sqlPreviewEl.textContent = sql;
    }
    
    resetBuilder() {
        // Reset all fields
        this.selectedTable = '';
        this.selectedColumns = [];
        this.joinType = 'INNER JOIN';
        this.joinTable = '';
        this.joinCondition = '';
        this.whereCondition = '';
        this.orderColumn = '';
        this.orderDirection = 'ASC';
        
        // Reset form controls
        this.selectTableEl.value = '';
        this.selectColumnsEl.innerHTML = '';
        this.joinTypeEl.value = 'INNER JOIN';
        this.joinTableEl.value = '';
        this.joinConditionEl.value = '';
        this.whereConditionEl.value = '';
        this.orderColumnEl.value = '';
        this.orderDirectionEl.value = 'ASC';
        
        // Update SQL preview
        this.updateSqlPreview();
    }
    
    runQuery() {
        const sql = this.sqlPreviewEl.textContent;
        
        if (sql.trim() === '' || !this.selectedTable) {
            showToast(this.uuid, 'Please select a table and build a valid query', 'warning');
            return;
        }
        
        try {
            // Execute the query and display results
            this.quizApp.executeQueryAndDisplay(sql);
            showToast(this.uuid, 'Query executed successfully', 'success');
        } catch (error) {
            showToast(this.uuid, `Error executing query: ${error.message}`, 'danger');
        }
    }
}

// SQLQuizApp class
class SQLQuizApp {
    constructor(uuid, SQL) {
        this.uuid = uuid;
        this.SQL = SQL;
        this.db = null;
        this.questions = [];
        this.questionOrder = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.answeredQuestions = new Set();
        
        // DOM elements
        this.questionTitle = document.getElementById(`pl-sql-quiz-title-${uuid}`);
        this.questionCounter = document.getElementById(`pl-sql-quiz-counter-${uuid}`);
        this.questionContent = document.getElementById(`pl-sql-quiz-content-${uuid}`);
        this.resultsContent = document.getElementById(`pl-sql-results-${uuid}`);
        this.chartContainer = document.getElementById(`pl-sql-chart-${uuid}`);
        this.schemaContainer = document.getElementById(`pl-sql-schema-${uuid}`);
        this.progressBar = document.getElementById(`pl-sql-quiz-progress-${uuid}`);
        this.inputEl = document.getElementById(`pl-sql-quiz-input-${uuid}`);
        
        // Buttons
        this.prevBtn = document.getElementById(`pl-sql-quiz-prev-${uuid}`);
        this.nextBtn = document.getElementById(`pl-sql-quiz-next-${uuid}`);
        this.checkAnswerBtn = document.getElementById(`pl-sql-quiz-check-${uuid}`);
        this.resetBtn = document.getElementById(`pl-sql-quiz-reset-${uuid}`);
        
        // Event listeners
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.navigateQuestion(-1));
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.navigateQuestion(1));
        }
        
        if (this.checkAnswerBtn) {
            this.checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetQuiz());
        }
    }
    
    initialize() {
        // Initialize SQL database
        this.db = new this.SQL.Database();
        
        // Load questions
        try {
            const questionsEl = document.querySelector(`script[id^="pl-sql-quiz-questions-"]`);
            if (questionsEl) {
                this.questions = JSON.parse(questionsEl.textContent.replace(/&quot;/g, '"'));
            } else {
                // Default questions (empty array) if not found
                this.questions = [];
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            this.questions = [];
        }
        
        // Get initialization SQL
        const initSqlEl = document.querySelector(`script[id^="pl-sql-quiz-init-sql-"]`);
        if (initSqlEl) {
            try {
                const initSql = initSqlEl.textContent.replace(/&quot;/g, '"');
                this.db.run(initSql);
            } catch (error) {
                console.error('Error initializing database:', error);
                showToast(this.uuid, 'Error setting up database: ' + error.message, 'danger');
            }
        }
        
        // Setup schema information
        try {
            const schemaEl = document.querySelector(`script[id^="pl-sql-quiz-schema-"]`);
            if (schemaEl) {
                const schema = JSON.parse(schemaEl.textContent.replace(/&quot;/g, '"'));
                this.displayDatabaseSchema(schema);
            } else {
                // Generate schema from database if not provided
                this.generateSchemaFromDatabase();
            }
        } catch (error) {
            console.error('Error loading schema:', error);
            this.generateSchemaFromDatabase();
        }
        
        // Randomize questions
        this.randomizeQuestions();
        
        // Show first question
        this.displayQuestion();
        
        // Update progress bar
        this.updateProgress();
    }
    
    randomizeQuestions() {
        // Create an array of indices and shuffle it
        this.questionOrder = [...Array(this.questions.length).keys()];
        this.shuffleArray(this.questionOrder);
        
        // Initialize user answers array based on randomized order
        this.userAnswers = new Array(this.questions.length).fill(null);
    }
    
    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    generateSchemaFromDatabase() {
        try {
            // Get tables from the database

            const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values;
            
            // Generate HTML for schema
            let schemaHtml = '';
            
            tables.forEach(table => {
                const tableName = table[0];
                
                // Get table columns
                const pragma = this.db.exec(`PRAGMA table_info(${tableName})`)[0];
                
                // Create HTML for the table schema
                schemaHtml += `
                    <div class="schema-table">
                        <div class="schema-table-header" data-table="${tableName}">
                            <i class="fa fa-table me-2"></i>${tableName}
                            <i class="fa fa-chevron-down float-end"></i>
                        </div>
                        <div class="schema-table-content" id="schema-${tableName}-${this.uuid}">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Type</th>
                                        <th>PK</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                // Add rows for each column
                pragma.values.forEach(col => {
                    const colName = col[1];
                    const colType = col[2];
                    const isPK = col[5] === 1 ? 'Yes' : 'No';
                    
                    schemaHtml += `
                        <tr>
                            <td>${colName}</td>
                            <td>${colType}</td>
                            <td>${isPK}</td>
                        </tr>
                    `;
                });
                
                schemaHtml += `
                                </tbody>
                            </table>
                            
                            <div class="sample-data mt-3">
                                <p class="mb-1"><strong>Sample Data:</strong></p>
                `;
                
                // Add sample data
                try {
                    const sampleData = this.db.exec(`SELECT * FROM ${tableName} LIMIT 3`)[0];
                    
                    if (sampleData) {
                        schemaHtml += `
                            <div class="table-container">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                        `;
                        
                        // Add headers
                        sampleData.columns.forEach(col => {
                            schemaHtml += `<th>${col}</th>`;
                        });
                        
                        schemaHtml += `
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;
                        
                        // Add rows
                        sampleData.values.forEach(row => {
                            schemaHtml += '<tr>';
                            row.forEach(cell => {
                                schemaHtml += `<td>${cell !== null ? cell : 'NULL'}</td>`;
                            });
                            schemaHtml += '</tr>';
                        });
                        
                        schemaHtml += `
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                } catch (e) {
                    schemaHtml += `<p>No sample data available.</p>`;
                }
                
                schemaHtml += `
                            </div>
                        </div>
                    </div>
                `;
            });
            
            this.schemaContainer.innerHTML = schemaHtml;
            
            // Add event listeners to table headers
            document.querySelectorAll('.schema-table-header').forEach(header => {
                header.addEventListener('click', () => {
                    const content = header.nextElementSibling;
                    content.classList.toggle('active');
                    
                    const icon = header.querySelector('.fa.fa-chevron-down, .fa.fa-chevron-up');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                });
            });
        } catch (error) {
            console.error('Error generating schema from database:', error);
            this.schemaContainer.innerHTML = `
                <div class="alert alert-danger">
                    <p>Error generating database schema.</p>
                </div>
            `;
        }
    }
    
    displayDatabaseSchema(schema) {
        try {
            // Generate HTML for schema
            let schemaHtml = '';
            
            schema.forEach(table => {
                // Create HTML for the table schema
                schemaHtml += `
                    <div class="schema-table">
                        <div class="schema-table-header" data-table="${table.name}">
                            <i class="fa fa-table me-2"></i>${table.name}
                            <i class="fa fa-chevron-down float-end"></i>
                        </div>
                        <div class="schema-table-content" id="schema-${table.name}-${this.uuid}">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Type</th>
                                        <th>PK</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                // Add rows for each column
                table.columns.forEach(column => {
                    const isPK = column.primaryKey ? 'Yes' : 'No';
                    
                    schemaHtml += `
                        <tr>
                            <td>${column.name}</td>
                            <td>${column.type}</td>
                            <td>${isPK}</td>
                        </tr>
                    `;
                });
                
                schemaHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            
            this.schemaContainer.innerHTML = schemaHtml;
            
            // Add event listeners to table headers
            document.querySelectorAll('.schema-table-header').forEach(header => {
                header.addEventListener('click', () => {
                    const content = header.nextElementSibling;
                    content.classList.toggle('active');
                    
                    const icon = header.querySelector('.fa.fa-chevron-down, .fa.fa-chevron-up');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                });
            });
        } catch (error) {
            console.error('Error displaying database schema:', error);
            this.generateSchemaFromDatabase();
        }
    }
    
    displayQuestion() {
        if (this.questions.length === 0) {
            this.questionContent.innerHTML = `
                <div class="alert alert-warning">
                    <p>No questions available.</p>
                </div>
            `;
            return;
        }
        
        // Clear any previous feedback
        const feedback = this.questionContent.querySelector('.feedback');
        if (feedback) feedback.remove();
        
        // Get the current question based on randomized order
        const questionIndex = this.questionOrder[this.currentQuestionIndex];
        const question = this.questions[questionIndex];
        
        // Update title and counter
        this.questionTitle.textContent = question.title;
        this.questionCounter.textContent = `${this.currentQuestionIndex + 1}/${this.questions.length}`;
        
        // Add level indicator
        const levelClass = `level-${question.level || 'medium'}`;
        this.questionTitle.innerHTML = `${question.title} <span class="level-badge ${levelClass}">${question.level || 'medium'}</span>`;
        
        // Create HTML based on question type
        let html = `<p class="mb-3">${question.description}</p>`;
        
        switch (question.type) {
            case 'multiple-choice':
                html += this.createMultipleChoiceHtml(question);
                break;
            case 'drag-drop':
                html += this.createDragDropHtml(question);
                break;
            case 'fill-in-blanks':
                html += this.createFillInBlanksHtml(question);
                break;
            case 'build-query':
                html += this.createBuildQueryHtml(question);
                break;
            default:
                html += `
                    <div class="alert alert-danger">
                        <p>Unknown question type: ${question.type}</p>
                    </div>
                `;
        }
        
        this.questionContent.innerHTML = html;
        
        // Reset the check answer button
        if (this.checkAnswerBtn) {
            this.checkAnswerBtn.disabled = false;
        }
        
        // Clear previous results if this question hasn't been answered yet
        if (!this.answeredQuestions.has(this.currentQuestionIndex)) {
            this.resultsContent.innerHTML = `
                <div class="alert alert-info">
                    Results will appear here after you run a query.
                </div>
            `;
            if (this.chartContainer) {
                this.chartContainer.innerHTML = '';
            }
        }
        
        // Add event handlers based on question type
        switch (question.type) {
            case 'multiple-choice':
                this.setupMultipleChoiceHandlers();
                break;
            case 'drag-drop':
                this.setupDragDropHandlers();
                break;
            case 'fill-in-blanks':
                this.setupFillInBlanksHandlers();
                break;
            case 'build-query':
                this.setupBuildQueryHandlers();
                break;
        }
        
        // Restore previous answer if exists
        if (this.userAnswers[this.currentQuestionIndex] !== null) {
            this.restorePreviousAnswer();
            
            // If this question was already answered, disable the check button
            if (this.answeredQuestions.has(this.currentQuestionIndex) && this.checkAnswerBtn) {
                this.checkAnswerBtn.disabled = true;
            }
        }
        
        // Update button states
        this.updateNavigationButtons();
    }
    
    createMultipleChoiceHtml(question) {
        let html = '<div class="multiple-choice">';
        
        question.options.forEach((option, index) => {
            html += `
                <div class="choice-option" data-index="${index}">
                    <div class="sql-snippet">${option}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    createDragDropHtml(question) {
        let html = `
            <div class="drag-drop-container">
                <p class="mb-2">Arrange the following segments in the correct order:</p>
                <div class="drop-area mb-3" id="drop-area-${this.uuid}"></div>
                <div class="drag-options">
        `;
        
        // Create shuffled version of segments for dragging
        const shuffledIndices = [...Array(question.segments.length).keys()];
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        
        shuffledIndices.forEach(index => {
            html += `
                <div class="drag-option" draggable="true" data-index="${index}">
                    ${question.segments[index]}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    createFillInBlanksHtml(question) {
        let html = `<div class="fill-in-blanks-container">`;
        
        // Split the template by blanks
        const parts = question.template.split(/\[blank\d+\]/g);
        const blanks = question.template.match(/\[blank\d+\]/g) || [];
        
        html += '<div class="sql-snippet mb-3">';
        
        // Build the template with dropdown blanks
        for (let i = 0; i < parts.length; i++) {
            html += parts[i];
            
            if (i < blanks.length) {
                const blankName = blanks[i].replace(/[\[\]]/g, '');
                const options = question.blanks[blankName];
                
                html += `<select class="form-select-sm d-inline-block mx-1" style="width: auto;" data-blank="${blankName}">`;
                html += `<option value="">-- Select --</option>`;
                
                options.forEach(option => {
                    html += `<option value="${option}">${option}</option>`;
                });
                
                html += `</select>`;
            }
        }
        
        html += '</div></div>';
        return html;
    }
    
    createBuildQueryHtml(question) {
        let html = `
            <div class="build-query-container">
                <p class="mb-2">Build the SQL query by selecting the correct options:</p>
                <div class="query-builder p-2 border rounded bg-light">
        `;
        
        // Create the query builder with segments and dropdowns
        question.segments.forEach((segment, index) => {
            if (segment.type === 'static') {
                html += `<span class="query-segment">${segment.value}</span>`;
            } else if (segment.type === 'select') {
                html += `
                    <span class="segment-dropdown">
                        <select class="form-select-sm d-inline-block" data-index="${index}">
                            <option value="">-- Select --</option>
                `;
                
                segment.options.forEach((option, optIndex) => {
                    html += `<option value="${optIndex}">${option}</option>`;
                });
                
                html += `
                        </select>
                    </span>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    setupMultipleChoiceHandlers() {
        document.querySelectorAll('.choice-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                document.querySelectorAll('.choice-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Save the answer
                this.userAnswers[this.currentQuestionIndex] = parseInt(option.dataset.index);
            });
        });
    }
    
    setupDragDropHandlers() {
        const dragOptions = document.querySelectorAll('.drag-option');
        const dropArea = document.getElementById(`drop-area-${this.uuid}`);
        
        if (!dropArea) return;
        
        // Initialize drag options
        dragOptions.forEach(option => {
            option.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', option.dataset.index);
            });
        });
        
        // Initialize drop area
        dropArea.addEventListener('dragover', e => {
            e.preventDefault();
            dropArea.classList.add('active');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('active');
        });
        
        dropArea.addEventListener('drop', e => {
            e.preventDefault();
            dropArea.classList.remove('active');
            
            const index = e.dataTransfer.getData('text/plain');
            const option = document.querySelector(`.drag-option[data-index="${index}"]`);
            
            if (option) {
                // Clone the option to the drop area
                const clone = option.cloneNode(true);
                clone.setAttribute('draggable', 'false');
                clone.classList.add('dropped');
                
                // Add a remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-sm btn-danger';
                removeBtn.innerHTML = '<i class="fa fa-times"></i>';
                removeBtn.addEventListener('click', () => {
                    clone.remove();
                    option.style.display = 'block';
                    this.updateDragDropAnswer();
                });
                
                clone.appendChild(removeBtn);
                dropArea.appendChild(clone);
                
                // Hide the original option
                option.style.display = 'none';
                
                // Update the answer
                this.updateDragDropAnswer();
            }
        });
    }
    
    updateDragDropAnswer() {
        const droppedOptions = document.querySelectorAll(`#drop-area-${this.uuid} .drag-option`);
        const answer = Array.from(droppedOptions).map(option => parseInt(option.dataset.index));
        this.userAnswers[this.currentQuestionIndex] = answer;
    }
    
    setupFillInBlanksHandlers() {
        document.querySelectorAll('.fill-in-blanks-container select').forEach(select => {
            select.addEventListener('change', () => {
                // Gather all selections
                const selections = {};
                document.querySelectorAll('.fill-in-blanks-container select').forEach(sel => {
                    selections[sel.dataset.blank] = sel.value;
                });
                
                // Save the answer
                this.userAnswers[this.currentQuestionIndex] = selections;
            });
        });
    }
    
    setupBuildQueryHandlers() {
        document.querySelectorAll('.build-query-container select').forEach(select => {
            select.addEventListener('change', () => {
                // Gather all selections
                const selections = [];
                document.querySelectorAll('.build-query-container select').forEach(sel => {
                    if (sel.value) {
                        selections[parseInt(sel.dataset.index)] = parseInt(sel.value);
                    }
                });
                
                // Save the answer
                this.userAnswers[this.currentQuestionIndex] = selections;
            });
        });
    }
    
    restorePreviousAnswer() {
        const answer = this.userAnswers[this.currentQuestionIndex];
        const questionIndex = this.questionOrder[this.currentQuestionIndex];
        const question = this.questions[questionIndex];
        
        if (answer === null) return;
        
        switch (question.type) {
            case 'multiple-choice':
                const option = document.querySelector(`.choice-option[data-index="${answer}"]`);
                if (option) option.classList.add('selected');
                break;
                
            case 'drag-drop':
                // For simplicity, we'll just display the feedback for drag-drop
                // Full restoration would be more complex
                if (this.answeredQuestions.has(this.currentQuestionIndex)) {
                    this.showDragDropFeedback(question, answer);
                }
                break;
                
            case 'fill-in-blanks':
                // Restore dropdown selections
                for (const [blank, value] of Object.entries(answer)) {
                    const dropdown = document.querySelector(`select[data-blank="${blank}"]`);
                    if (dropdown) dropdown.value = value;
                }
                break;
                
            case 'build-query':
                // Restore dropdown selections
                for (let i = 0; i < answer.length; i++) {
                    if (answer[i] !== undefined) {
                        const dropdown = document.querySelector(`select[data-index="${i}"]`);
                        if (dropdown) dropdown.value = answer[i];
                    }
                }
                break;
        }
    }
    
    showDragDropFeedback(question, userAnswer) {
        // This is a simplified approach to show feedback for drag-drop questions
        // when restoring a previously answered question
        let correctQuery = question.segments.join(' ');
        let userQuery = userAnswer.map(index => question.segments[index]).join(' ');
        let isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
        
        let feedbackHtml = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <h5><i class="fa ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'} me-2"></i>${isCorrect ? 'Correct!' : 'Incorrect'}</h5>
                <p>${question.explanation}</p>
                <div class="mt-3">
                    <strong>Correct query:</strong>
                    <div class="sql-snippet">${correctQuery}</div>
                </div>
        `;
        
        if (!isCorrect) {
            feedbackHtml += `
                <div class="mt-3">
                    <strong>Your query:</strong>
                    <div class="sql-snippet">${userQuery}</div>
                </div>
            `;
        }
        
        feedbackHtml += `</div>`;
        
        // Add feedback to the question content
        this.questionContent.innerHTML += feedbackHtml;
    }
    
    navigateQuestion(direction) {
        this.currentQuestionIndex += direction;
        
        // Ensure index is within bounds
        if (this.currentQuestionIndex < 0) {
            this.currentQuestionIndex = 0;
        } else if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = this.questions.length - 1;
        }
        
        // Display the current question
        this.displayQuestion();
        
        // Update progress
        this.updateProgress();
    }
    
    updateNavigationButtons() {
        // Update previous button
        if (this.prevBtn) {
            if (this.currentQuestionIndex === 0) {
                this.prevBtn.disabled = true;
            } else {
                this.prevBtn.disabled = false;
            }
        }
        
        // Update next button
        if (this.nextBtn) {
            if (this.currentQuestionIndex === this.questions.length - 1) {
                this.nextBtn.disabled = true;
            } else {
                this.nextBtn.disabled = false;
            }
        }
    }
    
    updateProgress() {
        // Calculate progress percentage
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
    }
    
    checkAnswer() {
        const questionIndex = this.questionOrder[this.currentQuestionIndex];
        const question = this.questions[questionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        
        if (userAnswer === null) {
            showToast(this.uuid, 'Please provide an answer before checking', 'warning');
            return;
        }
        
        // Add this question to answered set
        this.answeredQuestions.add(this.currentQuestionIndex);
        
        let isCorrect = false;
        let correctQuery = '';
        let userQuery = '';
        
        switch (question.type) {
            case 'multiple-choice':
                isCorrect = userAnswer === question.correctAnswer;
                correctQuery = question.options[question.correctAnswer];
                userQuery = question.options[userAnswer];
                
                // Highlight correct and incorrect answers
                document.querySelectorAll('.choice-option').forEach((option, index) => {
                    if (index === question.correctAnswer) {
                        option.classList.add('correct');
                    } else if (index === userAnswer && !isCorrect) {
                        option.classList.add('incorrect');
                    }
                });
                break;
                
            case 'drag-drop':
                // Compare user order with correct order
                isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
                correctQuery = question.segments.join(' ');
                userQuery = userAnswer.map(index => question.segments[index]).join(' ');
                break;
                
            case 'fill-in-blanks':
                // Check if all blanks match correct answers
                isCorrect = Object.entries(question.correctAnswers).every(
                    ([blank, correct]) => userAnswer[blank] === correct
                );
                
                // Construct the correct query
                let correctQueryParts = question.template;
                for (const [blank, value] of Object.entries(question.correctAnswers)) {
                    correctQueryParts = correctQueryParts.replace(`[${blank}]`, value);
                }
                correctQuery = correctQueryParts;
                
                // Construct the user query
                let userQueryParts = question.template;
                for (const [blank, value] of Object.entries(userAnswer)) {
                    userQueryParts = userQueryParts.replace(`[${blank}]`, value || '[empty]');
                }
                userQuery = userQueryParts;
                break;
                
            case 'build-query':
                // Check if selected options match correct answers
                isCorrect = question.correctAnswers.every((correct, index) => 
                    userAnswer[index] === correct
                );
                
                // Construct the correct query
                correctQuery = question.segments.map((segment, index) => {
                    if (segment.type === 'static') return segment.value;
                    return segment.options[question.correctAnswers[index]];
                }).join(' ');
                
                // Construct the user query
                userQuery = question.segments.map((segment, index) => {
                    if (segment.type === 'static') return segment.value;
                    return segment.options[userAnswer[index]] || '[empty]';
                }).join(' ');
                break;
        }
        
        // Display feedback
        let feedbackHtml = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <h5><i class="fa ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'} me-2"></i>${isCorrect ? 'Correct!' : 'Incorrect'}</h5>
                <p>${question.explanation}</p>
                <div class="mt-3">
                    <strong>Correct query:</strong>
                    <div class="sql-snippet">${correctQuery}</div>
                </div>
        `;
        
        if (!isCorrect) {
            feedbackHtml += `
                <div class="mt-3">
                    <strong>Your query:</strong>
                    <div class="sql-snippet">${userQuery}</div>
                </div>
            `;
        }
        
        feedbackHtml += `</div>`;
        
        // Add feedback to the question content
        this.questionContent.innerHTML += feedbackHtml;
        
        // Execute the correct query and display results
        this.executeQueryAndDisplay(correctQuery);
        
        // Disable check button after showing answer
        if (this.checkAnswerBtn) {
            this.checkAnswerBtn.disabled = true;
        }
        
        // Update score if correct
        if (isCorrect) {
            this.score++;
        }
        
        // Update the input with the quiz state
        this.updateInputValue();
    }
    
    executeQueryAndDisplay(query) {
        try {
            // Execute query
            const results = this.db.exec(query);
            
            if (results.length === 0) {
                // Query executed but no results (e.g., INSERT, UPDATE)
                this.resultsContent.innerHTML = `
                    <div class="alert alert-success">
                        Query executed successfully. No results returned.
                    </div>
                `;
                // Clear any existing chart
                if (this.chartContainer) {
                    this.chartContainer.innerHTML = '';
                }
                return;
            }
            
            // Get query results
            const columns = results[0].columns;
            const values = results[0].values;
            
            // Create table for results
            let tableHtml = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
            `;
            
            // Add table headers
            columns.forEach(col => {
                tableHtml += `<th>${col}</th>`;
            });
            
            tableHtml += `
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add table rows
            values.forEach(row => {
                tableHtml += '<tr>';
                row.forEach(cell => {
                    tableHtml += `<td>${cell !== null ? cell : 'NULL'}</td>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += `
                        </tbody>
                    </table>
                </div>
                <p>${values.length} row(s) returned</p>
            `;
            
            this.resultsContent.innerHTML = tableHtml;
            
            // Create visualization if appropriate and if Chart.js is available
            if (this.chartContainer && typeof Chart !== 'undefined') {
                this.createVisualization(query, results[0]);
            }
            
        } catch (error) {
            // Query execution failed
            this.resultsContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fa fa-exclamation-triangle me-2"></i>
                    Error executing query: ${error.message}
                </div>
            `;
            // Clear any existing chart
            if (this.chartContainer) {
                this.chartContainer.innerHTML = '';
            }
        }
    }
    
    createVisualization(query, results) {
        // Clear previous chart
        this.chartContainer.innerHTML = '';
        
        // Check if results can be visualized
        if (!results || results.values.length === 0) return;
        
        // Determine if this query is good for visualization
        const columns = results.columns;
        const values = results.values;
        
        // Simple heuristic: If we have 2+ columns and one looks like a category and another is numeric
        if (columns.length >= 2) {
            const possibleChartTypes = [];
            
            // Check for aggregations (COUNT, SUM, AVG, etc.)
            const hasAggregation = query.toUpperCase().includes('COUNT(') || 
                                 query.toUpperCase().includes('SUM(') ||
                                 query.toUpperCase().includes('AVG(') ||
                                 query.toUpperCase().includes('MIN(') ||
                                 query.toUpperCase().includes('MAX(');
            
            // Check if we have a GROUP BY
            const hasGroupBy = query.toUpperCase().includes('GROUP BY');
            
            // If we have aggregation and group by, this is likely a good candidate for a bar chart
            if (hasAggregation && hasGroupBy) {
                possibleChartTypes.push('bar');
            }
            
            // If we have few rows and mostly text columns, a pie chart might be good
            if (values.length <= 8 && 
                columns.find(col => 
                    values.every(row => typeof row[columns.indexOf(col)] === 'string' || 
                               typeof row[columns.indexOf(col)] === 'number'))) {
                possibleChartTypes.push('pie');
            }
            
            // If we have a date/time column and a numeric column, a line chart might be good
            if (columns.find(col => values.some(row => row[columns.indexOf(col)]?.toString().match(/^\d{4}-\d{2}-\d{2}/))) &&
                columns.find(col => values.every(row => typeof row[columns.indexOf(col)] === 'number' || 
                               (!isNaN(parseFloat(row[columns.indexOf(col)])) && row[columns.indexOf(col)] !== null)))) {
                possibleChartTypes.push('line');
            }
            
            // Default to bar chart if possible
            const chartType = possibleChartTypes.includes('bar') ? 'bar' : 
                             (possibleChartTypes.includes('pie') ? 'pie' : 
                             (possibleChartTypes.includes('line') ? 'line' : null));
            
            if (chartType) {
                // Create canvas for chart
                const canvas = document.createElement('canvas');
                this.chartContainer.appendChild(canvas);
                
                // Determine which columns to use
                let labelColumn = 0;
                let dataColumn = 1;
                
                // Find a suitable label column (preferably text)
                for (let i = 0; i < columns.length; i++) {
                    if (values.every(row => typeof row[i] === 'string')) {
                        labelColumn = i;
                        break;
                    }
                }
                
                // Find a suitable data column (must be numeric)
                for (let i = 0; i < columns.length; i++) {
                    if (i !== labelColumn && values.every(row => 
                        typeof row[i] === 'number' || 
                        (!isNaN(parseFloat(row[i])) && row[i] !== null))) {
                        dataColumn = i;
                        break;
                    }
                }
                
                // Extract data
                const labels = values.map(row => row[labelColumn]);
                const data = values.map(row => parseFloat(row[dataColumn]));
                
                // Create chart
                new Chart(canvas, {
                    type: chartType,
                    data: {
                        labels: labels,
                        datasets: [{
                            label: columns[dataColumn],
                            data: data,
                            backgroundColor: chartType === 'line' ? 'rgba(67, 97, 238, 0.2)' : 
                                labels.map((_, i) => {
                                    const hue = (i * 30) % 360;
                                    return chartType === 'pie' ? 
                                        `hsl(${hue}, 70%, 60%)` : 
                                        `rgba(67, 97, 238, ${0.5 + (i * 0.5 / labels.length)})`;
                                }),
                            borderColor: chartType === 'line' ? 'rgba(67, 97, 238, 1)' : 
                                labels.map((_, i) => {
                                    const hue = (i * 30) % 360;
                                    return chartType === 'pie' ? 
                                        `hsl(${hue}, 70%, 50%)` : 
                                        'rgba(67, 97, 238, 1)';
                                }),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                display: chartType !== 'pie'
                            },
                            x: {
                                display: chartType !== 'pie'
                            }
                        }
                    }
                });
            }
        }
    }
    
    resetQuiz() {
        // Confirm reset
        if (confirm('Are you sure you want to reset the quiz? Your progress will be lost.')) {
            // Re-randomize questions
            this.randomizeQuestions();
            
            // Reset current state
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.answeredQuestions = new Set();
            
            // Reset check button
            if (this.checkAnswerBtn) {
                this.checkAnswerBtn.disabled = false;
            }
            
            // Clear results
            this.resultsContent.innerHTML = `
                <div class="alert alert-info">
                    Results will appear here after you run a query.
                </div>
            `;
            
            // Clear chart
            if (this.chartContainer) {
                this.chartContainer.innerHTML = '';
            }
            
            // Display first question
            this.displayQuestion();
            
            // Update progress bar
            this.updateProgress();
            
            // Show success toast
            showToast(this.uuid, 'Quiz has been reset with new questions', 'success');
            
            // Update input value
            this.updateInputValue();
        }
    }
    
    updateInputValue() {
        // Create a JSON object to store in the hidden input
        const inputData = {
            questions: this.questions,
            score: this.score,
            answers: this.userAnswers,
            questionOrder: this.questionOrder
        };
        
        // Update the hidden input
        if (this.inputEl) {
            this.inputEl.value = JSON.stringify(inputData);
        }
    }
}