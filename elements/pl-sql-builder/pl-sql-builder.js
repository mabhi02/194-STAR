$(function () {
    // Find all SQL Builder elements on the page
    document.querySelectorAll('[id^="pl-sql-builder-"]').forEach(function(builderElement) {
        const uuid = builderElement.id.replace('pl-sql-builder-', '');
        
        // Initialize SQL.js
        initSqlJs({
            locateFile: file => `${window.PLConfig.clientFilesCourseUrl}/sql.js/${file}`
        }).then(SQL => {
            // Create a database
            const db = new SQL.Database();
            
            // Get schema and init SQL from data attributes
            const schema = JSON.parse(builderElement.dataset.schema || '[]');
            const initSql = builderElement.dataset.initSql || '';
            
            // Setup the database
            setupDatabase(db, schema, initSql);
            
            // Initialize the query builder
            const builder = new SQLQueryBuilder(db, uuid);
            builder.initialize();
            
            // Display schema
            displayDatabaseSchema(db, uuid);
            
            // Display relationship diagram
            displayRelationshipDiagram(uuid);
            
        }).catch(err => {
            showToast(uuid, 'Error initializing SQL database: ' + err.message, 'danger');
        });
    });

    // SQLQueryBuilder class
    class SQLQueryBuilder {
        constructor(db, uuid) {
            this.db = db;
            this.uuid = uuid;
            this.selectedTable = '';
            this.tableAlias = '';
            this.selectedColumns = [];
            this.joinType = 'INNER JOIN';
            this.joinTable = '';
            this.joinTableAlias = '';
            this.joinCondition = '';
            this.joinColumns = [];
            this.columnAliases = {};
            this.whereCondition = '';
            this.groupColumns = [];
            this.havingCondition = '';
            this.orderColumn = '';
            this.orderDirection = 'ASC';
            
            // Builder elements
            this.builderSection = document.getElementById(`pl-sql-builder-${uuid}`);
            this.resetBtn = document.getElementById(`reset-builder-${uuid}`);
            this.runBtn = document.getElementById(`run-builder-query-${uuid}`);
            
            // SELECT tab elements
            this.selectTableEl = document.getElementById(`select-table-${uuid}`);
            this.selectColumnsEl = document.getElementById(`select-columns-${uuid}`);
            
            // JOIN tab elements
            this.joinTypeEl = document.getElementById(`join-type-${uuid}`);
            this.joinTableEl = document.getElementById(`join-table-${uuid}`);
            this.joinConditionEl = document.getElementById(`join-condition-${uuid}`);
            
            // WHERE tab elements
            this.whereConditionEl = document.getElementById(`where-condition-${uuid}`);
            
            // GROUP BY tab elements
            this.groupColumnsEl = document.getElementById(`group-columns-${uuid}`);
            this.havingConditionEl = document.getElementById(`having-condition-${uuid}`);
            
            // ORDER BY tab elements
            this.orderColumnEl = document.getElementById(`order-column-${uuid}`);
            this.orderDirectionEl = document.getElementById(`order-direction-${uuid}`);
            
            // SQL preview element
            this.sqlPreviewEl = document.getElementById(`sql-preview-${uuid}`);
            
            // Results elements
            this.resultsContent = document.getElementById('results-content');
            this.chartContainer = document.getElementById('chart-container');
        }
        
        initialize() {
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
                this.populateJoinColumns();
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
            
            this.havingConditionEl.addEventListener('input', () => {
                this.havingCondition = this.havingConditionEl.value;
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
            
            // Populate tables on initialization
            this.populateTables();
        }
        
        populateTables() {
            // Clear existing options
            this.selectTableEl.innerHTML = '<option value="">-- Select a table --</option>';
            this.joinTableEl.innerHTML = '<option value="">-- Select a table --</option>';
            
            // Get tables from the database
            try {
                const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values;
                
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
            }
        }
        
        populateColumns() {
            // Clear existing columns
            this.selectColumnsEl.innerHTML = '';
            this.groupColumnsEl.innerHTML = '';
            this.selectedColumns = [];
            this.groupColumns = [];
            
            if (!this.selectedTable) return;
            
            // Get columns for the selected table
            try {
                const pragma = this.db.exec(`PRAGMA table_info(${this.selectedTable})`)[0];
                
                // Create a clickable option for each column
                pragma.values.forEach(col => {
                    const colName = col[1];
                    const colType = col[2];
                    
                    // Create column option element for SELECT
                    const columnEl = document.createElement('div');
                    columnEl.className = 'column-option';
                    columnEl.dataset.column = colName;
                    columnEl.textContent = colName;
                    
                    // Add click event to toggle selection
                    columnEl.addEventListener('click', () => {
                        columnEl.classList.toggle('selected');
                        
                        if (columnEl.classList.contains('selected')) {
                            this.selectedColumns.push(colName);
                        } else {
                            this.selectedColumns = this.selectedColumns.filter(col => col !== colName);
                        }
                        
                        this.updateSqlPreview();
                    });
                    
                    this.selectColumnsEl.appendChild(columnEl);
                    
                    // Create column option element for GROUP BY
                    const groupColumnEl = document.createElement('div');
                    groupColumnEl.className = 'column-option';
                    groupColumnEl.dataset.column = colName;
                    groupColumnEl.textContent = colName;
                    
                    // Add click event to toggle group by selection
                    groupColumnEl.addEventListener('click', () => {
                        groupColumnEl.classList.toggle('selected');
                        
                        if (groupColumnEl.classList.contains('selected')) {
                            this.groupColumns.push(colName);
                        } else {
                            this.groupColumns = this.groupColumns.filter(col => col !== colName);
                        }
                        
                        this.updateSqlPreview();
                    });
                    
                    this.groupColumnsEl.appendChild(groupColumnEl);
                });
            } catch (error) {
                console.error('Error fetching columns:', error);
            }
        }
        
        populateJoinColumns() {
            // Clear existing columns
            this.joinColumnsEl.innerHTML = '';
            this.joinColumns = [];
            
            if (!this.joinTable) return;
            
            // Get columns for the joined table
            try {
                const pragma = this.db.exec(`PRAGMA table_info(${this.joinTable})`)[0];
                
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
                            this.joinColumns.push(colName);
                        } else {
                            this.joinColumns = this.joinColumns.filter(col => col !== colName);
                        }
                        
                        this.updateSqlPreview();
                    });
                    
                    this.joinColumnsEl.appendChild(columnEl);
                });
            } catch (error) {
                console.error('Error fetching join columns:', error);
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
            
            // Add GROUP BY clause
            if (this.groupColumns.length > 0) {
                sql += `\nGROUP BY ${this.groupColumns.join(', ')}`;
                
                // Add HAVING clause
                if (this.havingCondition) {
                    sql += `\nHAVING ${this.havingCondition}`;
                }
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
            this.joinColumns = [];
            this.whereCondition = '';
            this.groupColumns = [];
            this.havingCondition = '';
            this.orderColumn = '';
            this.orderDirection = 'ASC';
            
            // Reset form controls
            this.selectTableEl.value = '';
            this.selectColumnsEl.innerHTML = '';
            this.groupColumnsEl.innerHTML = '';
            this.joinTypeEl.value = 'INNER JOIN';
            this.joinTableEl.value = '';
            this.joinConditionEl.value = '';
            this.joinColumnsEl.innerHTML = '';
            this.whereConditionEl.value = '';
            this.havingConditionEl.value = '';
            this.orderColumnEl.value = '';
            this.orderDirectionEl.value = 'ASC';
            
            // Update SQL preview
            this.updateSqlPreview();
            
            // Clear results
            this.resultsContent.innerHTML = `
                <div class="alert alert-info">
                    Results will appear here after you run a query.
                </div>
            `;
            
            // Clear chart
            this.chartContainer.innerHTML = '';
        }
        
        runQuery() {
            const sql = this.sqlPreviewEl.textContent;
            
            if (sql.trim() === '' || !this.selectedTable) {
                showToast(this.uuid, 'Please select a table and build a valid query', 'warning');
                return;
            }
            
            try {
                // Execute the query and display results
                this.executeQueryAndDisplay(sql);
                showToast(this.uuid, 'Query executed successfully', 'success');
            } catch (error) {
                showToast(this.uuid, `Error executing query: ${error.message}`, 'danger');
            }
        }
        
        executeQueryAndDisplay(query) {
            try {
                // Execute query
                const results = this.db.exec(query);
                
                if (results.length === 0) {
                    // Query executed but no results
                    this.resultsContent.innerHTML = `
                        <div class="alert alert-success">
                            Query executed successfully. No results returned.
                        </div>
                    `;
                    // Clear any existing chart
                    this.chartContainer.innerHTML = '';
                    return;
                }
                
                // Get query results
                const columns = results[0].columns;
                const values = results[0].values;
                
                // Create table for results
                let tableHtml = `
                    <div class="table-container">
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
                
                // Create visualization if appropriate
                this.createVisualization(query, results[0]);
                
            } catch (error) {
                // Query execution failed
                this.resultsContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error executing query: ${error.message}
                    </div>
                `;
                // Clear any existing chart
                this.chartContainer.innerHTML = '';
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
                
                // Check for aggregations
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
    }
    
    // Set up database with sample data
    function setupDatabase(db, schema, initSql) {
        // Create customers table
        db.run(`
            CREATE TABLE customers (
                customer_id INTEGER PRIMARY KEY,
                first_name TEXT,
                last_name TEXT,
                email TEXT,
                city TEXT,
                state TEXT,
                country TEXT,
                registration_date TEXT
            )
        `);
        
        // Insert sample customers
        const customerData = [
            [1, 'John', 'Smith', 'john.smith@example.com', 'New York', 'NY', 'USA', '2022-01-15'],
            [2, 'Emily', 'Johnson', 'emily.j@example.com', 'Toronto', 'ON', 'Canada', '2022-02-20'],
            [3, 'Michael', 'Williams', 'michael.w@example.com', 'Chicago', 'IL', 'USA', '2022-03-10'],
            [4, 'Sophia', 'Brown', 'sophia.b@example.com', 'London', 'UK', 'UK', '2022-01-05'],
            [5, 'Daniel', 'Jones', 'daniel.j@example.com', 'Sydney', 'NSW', 'Australia', '2022-04-12']
        ];
        
        customerData.forEach(customer => {
            db.run(
                'INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                customer
            );
        });
        
        // Create orders table
        db.run(`
            CREATE TABLE orders (
                order_id INTEGER PRIMARY KEY,
                customer_id INTEGER,
                order_date TEXT,
                total_amount REAL,
                status TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
            )
        `);
        
        // Insert sample orders
        const orderData = [
            [1, 1, '2023-01-10', 1349.98, 'Delivered'],
            [2, 2, '2023-01-15', 899.99, 'Delivered'],
            [3, 3, '2023-02-05', 279.98, 'Shipped'],
            [4, 4, '2023-02-10', 129.99, 'Delivered'],
            [5, 5, '2023-02-20', 429.98, 'Processing']
        ];
        
        orderData.forEach(order => {
            db.run(
                'INSERT INTO orders VALUES (?, ?, ?, ?, ?)',
                order
            );
        });
    }
    
    // Display database schema function
    function displayDatabaseSchema(db, uuid) {
        // Get tables from the database
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values;
        const schemaTablesContainer = document.getElementById(`schema-tables-${uuid}`);
        
        // Create HTML for each table
        const schemaHtml = tables.map(table => {
            const tableName = table[0];
            
            // Get table columns
            const pragma = db.exec(`PRAGMA table_info(${tableName})`)[0];
            
            // Create HTML for the table schema
            let html = `
                <div class="schema-table">
                    <div class="schema-table-header" data-table="${tableName}">
                        <i class="fas fa-table me-2"></i>${tableName}
                        <i class="fas fa-chevron-down float-end"></i>
                    </div>
                    <div class="schema-table-content" id="schema-${tableName}-${uuid}">
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
                
                html += `
                    <tr>
                        <td>${colName}</td>
                        <td>${colType}</td>
                        <td>${isPK}</td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            return html;
        }).join('');
        
        // Add schema HTML to container
        schemaTablesContainer.innerHTML = schemaHtml;
        
        // Add event listeners to table headers
        document.querySelectorAll(`#schema-tables-${uuid} .schema-table-header`).forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('active');
                
                const icon = header.querySelector('.fas.fa-chevron-down, .fas.fa-chevron-up');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            });
        });
    }
    
    // Display relationship diagram
    function displayRelationshipDiagram(uuid) {
        // Create a simple SVG diagram of table relationships
        const diagram = `
            <svg width="350" height="200" xmlns="http://www.w3.org/2000/svg">
                <!-- Tables -->
                <rect x="20" y="20" width="100" height="50" rx="5" fill="#e9ecef" stroke="#495057" />
                <text x="70" y="50" text-anchor="middle" font-size="12">customers</text>
                
                <rect x="230" y="20" width="100" height="50" rx="5" fill="#e9ecef" stroke="#495057" />
                <text x="280" y="50" text-anchor="middle" font-size="12">orders</text>
                
                <!-- Relationships -->
                <line x1="120" y1="45" x2="230" y2="45" stroke="#495057" stroke-width="2" />
                <polygon points="220,40 230,45 220,50" fill="#495057" />
            </svg>
        `;
        
        document.querySelector(`#table-relation-diagram-${uuid}`).innerHTML = diagram;
    }
    
    // Toast notification function
    function showToast(uuid, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast show`;
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                  type === 'warning' ? 'fa-exclamation-triangle' : 
                                  type === 'danger' ? 'fa-times-circle' : 'fa-info-circle'} me-2"></i>
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 500);
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 500);
            });
        }
    }
}); 