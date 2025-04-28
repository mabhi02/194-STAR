import random
import sqlite3
import re

def create_database():
    """Create and return a new database connection with sample data."""
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Create customers table
    cursor.execute('''
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
    ''')
    
    # Create orders table
    cursor.execute('''
        CREATE TABLE orders (
            order_id INTEGER PRIMARY KEY,
            customer_id INTEGER,
            order_date TEXT,
            total_amount REAL,
            status TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
    ''')
    
    # Insert sample data
    cursor.execute("INSERT INTO customers VALUES (1, 'John', 'Smith', 'john@example.com', 'New York', 'NY', 'USA', '2022-01-01')")
    cursor.execute("INSERT INTO customers VALUES (2, 'Jane', 'Doe', 'jane@example.com', 'London', 'UK', 'UK', '2022-02-01')")
    cursor.execute("INSERT INTO customers VALUES (3, 'Bob', 'Johnson', 'bob@example.com', 'Toronto', 'ON', 'Canada', '2022-03-01')")
    
    cursor.execute("INSERT INTO orders VALUES (1, 1, '2023-01-01', 500.00, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (2, 1, '2023-02-01', 1200.00, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (3, 2, '2023-01-15', 800.00, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (4, 3, '2023-02-15', 300.00, 'Processing')")
    
    return conn

def generate(data):
    # Define correct answers as a list of possible correct queries for each question
    data['correct_answers']['query1'] = [
        '''
        SELECT title, price, publication_year
        FROM books
        WHERE price >= 20 AND price <= 50
        ''',
        '''
        SELECT title, price, publication_year
        FROM books
        WHERE price BETWEEN 20 AND 50
        '''
    ]
    
    data['correct_answers']['query2'] = [
        '''
        SELECT b.title, bo.order_date, bo.quantity
        FROM book_orders bo
        JOIN books b ON bo.book_id = b.id
        WHERE b.price > 40
        ''',
        '''
        SELECT b.title, bo.order_date, bo.quantity
        FROM book_orders bo
        INNER JOIN books b ON bo.book_id = b.id
        WHERE b.price > 40
        '''
    ]
    
    data['correct_answers']['query3'] = [
        '''
        SELECT b.title, bo.order_date, bo.quantity
        FROM book_orders bo
        JOIN books b ON bo.book_id = b.id
        WHERE b.price > 20
        ORDER BY bo.order_date DESC
        ''',
        '''
        SELECT b.title, bo.order_date, bo.quantity
        FROM book_orders bo
        INNER JOIN books b ON bo.book_id = b.id
        WHERE b.price > 20
        ORDER BY bo.order_date DESC
        '''
    ]

def grade(data):
    # Create a new database connection for grading
    conn = create_database()
    cursor = conn.cursor()
    
    # Grade each query
    for i in range(1, 4):
        query_name = f'query{i}'
        student_query = data['submitted_answers'][query_name]
        
        try:
            # Normalize the student's query
            normalized_student = re.sub(r'\s+', ' ', student_query).strip().upper()
            
            # Check against each possible correct answer
            is_correct = False
            for correct_query in data['correct_answers'][query_name]:
                # Normalize the correct query
                normalized_correct = re.sub(r'\s+', ' ', correct_query).strip().upper()
                
                # Check if the queries are identical
                if normalized_student == normalized_correct:
                    is_correct = True
                    break
                
                # If not identical, try to execute both queries and compare results
                try:
                    cursor.execute(student_query)
                    student_results = cursor.fetchall()
                    
                    cursor.execute(correct_query)
                    correct_results = cursor.fetchall()
                    
                    if student_results == correct_results:
                        is_correct = True
                        break
                except:
                    continue
            
            if is_correct:
                data['partial_scores'][query_name] = {'score': 1.0}
            else:
                data['partial_scores'][query_name] = {'score': 0.0}
                data['feedback'][query_name] = 'Your query produces different results than expected.'
                
        except Exception as e:
            data['partial_scores'][query_name] = {'score': 0.0}
            data['feedback'][query_name] = f'Error executing query: {str(e)}'
    
    # Close the database connection
    conn.close() 