$(function () {
    // Find all SQL Builder elements on the page
    document.querySelectorAll('[id^="pl-sql-builder-"]').forEach(function(builderElement) {
        const uuid = builderElement.id.replace('pl-sql-builder-', '');
        
        try {
            // Get schema and init SQL from data attributes
            const schema = JSON.parse(builderElement.dataset.schema || '[]');
            const initSql = builderElement.dataset.initSql || '';
            
            if (!schema || schema.length === 0) {
                throw new Error('No schema provided');
            }
            
            // Load SQL.js
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
            script.async = true;
            
            script.onload = function() {
                // Initialize SQL.js
                initSqlJs({
                    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
                }).then(SQL => {
                    try {
                        // Create a database
                        const db = new SQL.Database();
                        
                        // Setup the database
                        setupDatabase(db, schema, initSql);
                        
                        // Initialize the query builder
                        const builder = new SQLQueryBuilder(db, uuid);
                        builder.initialize();
                        
                        // Display schema
                        displayDatabaseSchema(db, uuid);
                        
                        // Display relationship diagram
                        displayRelationshipDiagram(uuid);
                    } catch (err) {
                        showToast(uuid, 'Error setting up database: ' + err.message, 'danger');
                        console.error('Database setup error:', err);
                    }
                }).catch(err => {
                    showToast(uuid, 'Error loading SQL.js: ' + err.message, 'danger');
                    console.error('SQL.js loading error:', err);
                });
            };
            
            script.onerror = function() {
                showToast(uuid, 'Error loading SQL.js script', 'danger');
                console.error('Failed to load SQL.js script');
            };
            
            document.head.appendChild(script);
        } catch (err) {
            showToast(uuid, 'Error parsing schema: ' + err.message, 'danger');
            console.error('Schema parsing error:', err);
        }
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
            this.orderColumns = [];
            this.orderDirection = 'ASC';
            
            // Builder elements
            this.builderSection = document.getElementById(`pl-sql-builder-${uuid}`);
            
            // SELECT tab elements
            this.selectTableEl = document.getElementById(`select-table-${uuid}`);
            this.tableAliasEl = document.getElementById(`table-alias-${uuid}`);
            this.selectColumnsEl = document.getElementById(`select-columns-${uuid}`);
            
            // JOIN tab elements
            this.joinTypeEl = document.getElementById(`join-type-${uuid}`);
            this.joinTableEl = document.getElementById(`join-table-${uuid}`);
            this.joinTableAliasEl = document.getElementById(`join-table-alias-${uuid}`);
            this.joinColumnsEl = document.getElementById(`join-columns-${uuid}`);
            this.joinConditionEl = document.getElementById(`join-condition-${uuid}`);
            
            // WHERE tab elements
            this.whereConditionEl = document.getElementById(`where-condition-${uuid}`);
            
            // GROUP BY tab elements
            this.groupColumnsEl = document.getElementById(`group-columns-${uuid}`);
            this.havingConditionEl = document.getElementById(`having-condition-${uuid}`);
            
            // ORDER BY tab elements
            this.orderColumnsEl = document.getElementById(`order-columns-${uuid}`);
            this.orderDirectionEl = document.getElementById(`order-direction-${uuid}`);
            
            // SQL preview element
            this.sqlPreviewEl = document.getElementById(`sql-preview-${uuid}`);
        }
        
        initialize() {
            // Add event listeners for form controls
            this.selectTableEl.addEventListener('change', () => {
                this.selectedTable = this.selectTableEl.value;
                this.tableAlias = this.tableAliasEl.value || this.selectedTable.charAt(0).toLowerCase();
                this.populateColumns();
                this.updateSqlPreview();
            });
            
            this.tableAliasEl.addEventListener('input', () => {
                this.tableAlias = this.tableAliasEl.value || this.selectedTable.charAt(0).toLowerCase();
                this.updateSqlPreview();
            });
            
            this.joinTypeEl.addEventListener('change', () => {
                this.joinType = this.joinTypeEl.value;
                this.updateSqlPreview();
            });
            
            this.joinTableEl.addEventListener('change', () => {
                this.joinTable = this.joinTableEl.value;
                this.joinTableAlias = this.joinTableAliasEl.value || this.joinTable.charAt(0).toLowerCase();
                this.populateJoinColumns();
                this.updateSqlPreview();
            });
            
            this.joinTableAliasEl.addEventListener('input', () => {
                this.joinTableAlias = this.joinTableAliasEl.value || this.joinTable.charAt(0).toLowerCase();
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
            this.orderColumnsEl.innerHTML = '';
            this.selectedColumns = [];
            this.groupColumns = [];
            this.orderColumns = [];
            
            if (!this.selectedTable) return;
            
            // Get columns for the selected table
            try {
                const pragma = this.db.exec(`PRAGMA table_info(${this.selectedTable})`)[0];
                
                // Add aggregate functions section
                const aggregateSection = document.createElement('div');
                aggregateSection.className = 'aggregate-section';
                aggregateSection.innerHTML = '<h6>Aggregate Functions</h6>';
                
                const aggregateFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
                aggregateFunctions.forEach(func => {
                    const funcEl = document.createElement('div');
                    funcEl.className = 'column-option aggregate';
                    funcEl.textContent = `${func}()`;
                    funcEl.addEventListener('click', () => {
                        const column = prompt(`Enter column name for ${func}:`);
                        if (column) {
                            this.selectedColumns.push(`${func}(${this.tableAlias}.${column}) as ${func.toLowerCase()}_${column}`);
                            this.updateSqlPreview();
                        }
                    });
                    aggregateSection.appendChild(funcEl);
                });
                
                this.selectColumnsEl.appendChild(aggregateSection);
                
                // Add regular columns section
                const columnsSection = document.createElement('div');
                columnsSection.className = 'columns-section';
                columnsSection.innerHTML = '<h6>Columns</h6>';
                
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
                            this.selectedColumns.push(`${this.tableAlias}.${colName}`);
                        } else {
                            this.selectedColumns = this.selectedColumns.filter(col => col !== `${this.tableAlias}.${colName}`);
                        }
                        
                        this.updateSqlPreview();
                    });
                    
                    columnsSection.appendChild(columnEl);
                    
                    // Create column option element for GROUP BY
                    const groupColumnEl = document.createElement('div');
                    groupColumnEl.className = 'column-option';
                    groupColumnEl.dataset.column = colName;
                    groupColumnEl.textContent = colName;
                    
                    // Add click event to toggle group by selection
                    groupColumnEl.addEventListener('click', () => {
                        groupColumnEl.classList.toggle('selected');
                        
                        if (groupColumnEl.classList.contains('selected')) {
                            this.groupColumns.push(`${this.tableAlias}.${colName}`);
                        } else {
                            this.groupColumns = this.groupColumns.filter(col => col !== `${this.tableAlias}.${colName}`);
                        }
                        
                        this.updateSqlPreview();
                    });
                    
                    this.groupColumnsEl.appendChild(groupColumnEl);
                    
                    // Create column option element for ORDER BY
                    const orderColumnEl = document.createElement('div');
                    orderColumnEl.className = 'column-option';
                    orderColumnEl.dataset.column = colName;
                    orderColumnEl.textContent = colName;
                    
                    // Add click event to toggle order by selection
                    orderColumnEl.addEventListener('click', () => {
                        orderColumnEl.classList.toggle('selected');
                        
                        if (orderColumnEl.classList.contains('selected')) {
                            this.orderColumns.push(`${this.tableAlias}.${colName}`);
                        } else {
                            this.orderColumns = this.orderColumns.filter(col => col !== `${this.tableAlias}.${colName}`);
                        }
                        
                        this.updateSqlPreview();
                    });
                    
                    this.orderColumnsEl.appendChild(orderColumnEl);
                });
                
                this.selectColumnsEl.appendChild(columnsSection);
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
                            this.joinColumns.push(`${this.joinTableAlias}.${colName}`);
                            this.selectedColumns.push(`${this.joinTableAlias}.${colName}`);
                        } else {
                            this.joinColumns = this.joinColumns.filter(col => col !== `${this.joinTableAlias}.${colName}`);
                            this.selectedColumns = this.selectedColumns.filter(col => col !== `${this.joinTableAlias}.${colName}`);
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
            
            // Add selected columns
            if (this.selectedColumns.length > 0) {
                sql += this.selectedColumns.join(', ');
            } else {
                sql += '*';
            }
            
            // Add FROM clause with alias
            if (this.selectedTable) {
                sql += ` FROM ${this.selectedTable} ${this.tableAlias}`;
            }
            
            // Add JOIN clause with alias
            if (this.joinTable && this.joinCondition) {
                sql += `\n${this.joinType} ${this.joinTable} ${this.joinTableAlias} ON ${this.joinCondition}`;
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
            if (this.orderColumns.length > 0) {
                sql += `\nORDER BY ${this.orderColumns.join(', ')} ${this.orderDirection}`;
            }
            
            // Update SQL preview
            this.sqlPreviewEl.textContent = sql;
        }
    }
    
    // Set up database with sample data
    function setupDatabase(db, schema, initSql) {
        // Create tables from schema
        schema.forEach(table => {
            const columns = table.columns.map(col => {
                let colDef = `${col.name} ${col.type}`;
                if (col.primaryKey) colDef += ' PRIMARY KEY';
                if (col.foreignKey) {
                    colDef += ` REFERENCES ${col.foreignKey.table}(${col.foreignKey.column})`;
                }
                return colDef;
            }).join(', ');
            
            db.run(`CREATE TABLE ${table.name} (${columns})`);
        });
        
        // Execute initialization SQL
        if (initSql) {
            db.run(initSql);
        }
    }
    
    // Display database schema
    function displayDatabaseSchema(db, uuid) {
        const schemaContainer = document.getElementById(`schema-tables-${uuid}`);
        schemaContainer.innerHTML = '';
        
        try {
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values;
            
            tables.forEach(table => {
                const tableName = table[0];
                const tableDiv = document.createElement('div');
                tableDiv.className = 'schema-table';
                
                // Get table info
                const pragma = db.exec(`PRAGMA table_info(${tableName})`)[0];
                
                let tableHtml = `<h6>${tableName}</h6><ul>`;
                pragma.values.forEach(col => {
                    const colName = col[1];
                    const colType = col[2];
                    const isPK = col[5] === 1 ? ' PRIMARY KEY' : '';
                    const isFK = col[6] ? ` REFERENCES ${col[6]}` : '';
                    tableHtml += `<li>${colName} ${colType}${isPK}${isFK}</li>`;
                });
                tableHtml += '</ul>';
                
                tableDiv.innerHTML = tableHtml;
                schemaContainer.appendChild(tableDiv);
            });
        } catch (error) {
            console.error('Error displaying schema:', error);
        }
    }
    
    // Display relationship diagram
    function displayRelationshipDiagram(uuid) {
        const diagramContainer = document.getElementById(`table-relation-diagram-${uuid}`);
        diagramContainer.innerHTML = '';
        
        // Create a simple SVG diagram showing table relationships
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '200');
        
        // Add table boxes and relationships
        // This is a simplified version - you might want to use a proper graph library
        const tables = document.querySelectorAll(`#schema-tables-${uuid} .schema-table`);
        let x = 50;
        
        tables.forEach(table => {
            const tableName = table.querySelector('h6').textContent;
            
            // Create table box
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', 50);
            rect.setAttribute('width', 150);
            rect.setAttribute('height', 100);
            rect.setAttribute('fill', '#f8f9fa');
            rect.setAttribute('stroke', '#6c757d');
            rect.setAttribute('stroke-width', '2');
            svg.appendChild(rect);
            
            // Add table name
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + 75);
            text.setAttribute('y', 80);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '14');
            text.textContent = tableName;
            svg.appendChild(text);
            
            x += 200;
        });
        
        diagramContainer.appendChild(svg);
    }
    
    // Show toast notification
    function showToast(uuid, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast show bg-${type} text-white`;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '1000';
        toast.innerHTML = `
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});