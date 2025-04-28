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
    
    # Create books table
    cursor.execute('''
        CREATE TABLE books (
            id INTEGER PRIMARY KEY,
            title TEXT,
            price REAL,
            publication_year INTEGER,
            author_id INTEGER
        )
    ''')
    
    # Create book_orders table
    cursor.execute('''
        CREATE TABLE book_orders (
            id INTEGER PRIMARY KEY,
            book_id INTEGER,
            quantity INTEGER,
            order_date TEXT,
            FOREIGN KEY (book_id) REFERENCES books(id)
        )
    ''')
    
    # Insert sample data
    cursor.execute("INSERT INTO customers VALUES (1, 'John', 'Smith', 'john.smith@example.com', 'New York', 'NY', 'USA', '2022-01-15')")
    cursor.execute("INSERT INTO customers VALUES (2, 'Emily', 'Johnson', 'emily.j@example.com', 'Toronto', 'ON', 'Canada', '2022-02-20')")
    cursor.execute("INSERT INTO customers VALUES (3, 'Michael', 'Williams', 'michael.w@example.com', 'Chicago', 'IL', 'USA', '2022-03-10')")
    cursor.execute("INSERT INTO customers VALUES (4, 'Sophia', 'Brown', 'sophia.b@example.com', 'London', 'UK', 'UK', '2022-01-05')")
    cursor.execute("INSERT INTO customers VALUES (5, 'Daniel', 'Jones', 'daniel.j@example.com', 'Sydney', 'NSW', 'Australia', '2022-04-12')")
    cursor.execute("INSERT INTO customers VALUES (6, 'Olivia', 'Garcia', 'olivia.g@example.com', 'Madrid', 'MD', 'Spain', '2022-02-28')")
    cursor.execute("INSERT INTO customers VALUES (7, 'James', 'Miller', 'james.m@example.com', 'Los Angeles', 'CA', 'USA', '2022-05-17')")
    cursor.execute("INSERT INTO customers VALUES (8, 'Emma', 'Davis', 'emma.d@example.com', 'Vancouver', 'BC', 'Canada', '2022-06-23')")
    
    cursor.execute("INSERT INTO orders VALUES (1, 1, '2023-01-10', 1349.98, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (2, 2, '2023-01-15', 899.99, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (3, 3, '2023-02-05', 279.98, 'Shipped')")
    cursor.execute("INSERT INTO orders VALUES (4, 4, '2023-02-10', 129.99, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (5, 5, '2023-02-20', 429.98, 'Processing')")
    cursor.execute("INSERT INTO orders VALUES (6, 1, '2023-03-05', 139.98, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (7, 2, '2023-03-15', 249.99, 'Shipped')")
    cursor.execute("INSERT INTO orders VALUES (8, 6, '2023-03-20', 159.98, 'Processing')")
    cursor.execute("INSERT INTO orders VALUES (9, 7, '2023-04-10', 1099.98, 'Delivered')")
    cursor.execute("INSERT INTO orders VALUES (10, 8, '2023-04-12', 229.98, 'Pending')")
    cursor.execute("INSERT INTO orders VALUES (11, 3, '2023-05-05', 149.99, 'Shipped')")
    cursor.execute("INSERT INTO orders VALUES (12, 4, '2023-05-10', 249.99, 'Delivered')")
    
    cursor.execute("INSERT INTO books VALUES (1, 'SQL Fundamentals', 29.99, 2020, 1)")
    cursor.execute("INSERT INTO books VALUES (2, 'Advanced SQL', 49.99, 2021, 1)")
    cursor.execute("INSERT INTO books VALUES (3, 'Database Design', 39.99, 2019, 2)")
    cursor.execute("INSERT INTO books VALUES (4, 'Web Development Basics', 24.99, 2022, 3)")
    cursor.execute("INSERT INTO books VALUES (5, 'Python Programming', 34.99, 2021, 4)")
    cursor.execute("INSERT INTO books VALUES (6, 'JavaScript Mastery', 44.99, 2022, 3)")
    cursor.execute("INSERT INTO books VALUES (7, 'Data Science Essentials', 54.99, 2020, 5)")
    cursor.execute("INSERT INTO books VALUES (8, 'Machine Learning', 59.99, 2021, 5)")
    
    cursor.execute("INSERT INTO book_orders VALUES (1, 1, 3, '2023-01-15')")
    cursor.execute("INSERT INTO book_orders VALUES (2, 2, 1, '2023-01-20')")
    cursor.execute("INSERT INTO book_orders VALUES (3, 3, 2, '2023-02-05')")
    cursor.execute("INSERT INTO book_orders VALUES (4, 4, 1, '2023-02-10')")
    cursor.execute("INSERT INTO book_orders VALUES (5, 5, 4, '2023-03-15')")
    cursor.execute("INSERT INTO book_orders VALUES (6, 6, 2, '2023-03-20')")
    cursor.execute("INSERT INTO book_orders VALUES (7, 1, 1, '2023-04-10')")
    cursor.execute("INSERT INTO book_orders VALUES (8, 2, 2, '2023-04-15')")
    cursor.execute("INSERT INTO book_orders VALUES (9, 7, 3, '2023-05-05')")
    cursor.execute("INSERT INTO book_orders VALUES (10, 8, 1, '2023-05-10')")
    
    return conn

def generate(data):
    # Define correct answers as a list of possible correct queries for each question
    data['correct_answers']['query1'] = [
        '''
        SELECT first_name, last_name, country
        FROM customers
        '''
    ]
    
    data['correct_answers']['query2'] = [
        '''
        SELECT first_name, last_name, city
        FROM customers
        WHERE country = 'USA'
        '''
    ]
    
    data['correct_answers']['query3'] = [
        '''
        SELECT title, price, publication_year
        FROM books
        WHERE price > 50
        '''
    ]
    
    data['correct_answers']['query4'] = [
        '''
        SELECT country, COUNT(*) AS customer_count
        FROM customers
        GROUP BY country
        '''
    ]
    
    data['correct_answers']['query5'] = [
        '''
        SELECT b.title, bo.order_date, bo.quantity
        FROM book_orders bo
        JOIN books b ON bo.book_id = b.id
        ''',
        '''
        SELECT b.title, bo.order_date, bo.quantity
        FROM book_orders bo
        INNER JOIN books b ON bo.book_id = b.id
        '''
    ]
    
    data['correct_answers']['query6'] = [
        '''
        SELECT title, price, publication_year
        FROM books
        WHERE price > 10 AND price < 20
        '''
    ]
    
    data['correct_answers']['query7'] = [
        '''
        SELECT publication_year, AVG(price) AS average_price, COUNT(*) AS number_books
        FROM books
        GROUP BY publication_year
        ORDER BY publication_year ASC
        '''
    ]
    
    data['correct_answers']['query8'] = [
        '''
        SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spent
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.first_name, c.last_name
        ''',
        '''
        SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spent
        FROM customers c
        INNER JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.first_name, c.last_name
        '''
    ]
    
    data['correct_answers']['query9'] = [
        '''
        SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spent
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.first_name, c.last_name
        HAVING total_spent > 500
        ORDER BY total_spent DESC
        ''',
        '''
        SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spent
        FROM customers c
        INNER JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.first_name, c.last_name
        HAVING total_spent > 500
        ORDER BY total_spent DESC
        '''
    ]

def grade(data):
    # Create a new database connection for grading
    conn = create_database()
    cursor = conn.cursor()
    
    # Grade each query
    for i in range(1, 10):
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