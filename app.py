#!/usr/bin/env python3
"""
SQL Learning App
This script generates random SQL tables and provides interactive SQL learning challenges.
Just run this file directly to start the app.
"""

import random
import datetime
import sqlite3
import os
import time
from typing import List, Dict, Any, Optional

class DataPool:
    """Data pools for generating realistic looking data"""
    FIRST_NAMES = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Mary', 'Patricia', 
                  'Jennifer', 'Linda', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Emma']
    
    LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']
    
    CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
             'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville']
    
    STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 
             'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT']
    
    COUNTRIES = ['USA', 'Canada', 'Mexico', 'UK', 'France', 'Germany', 'Spain', 'Italy']
    
    DEPARTMENTS = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Legal', 'Operations']
    
    PRODUCT_CATEGORIES = ['Electronics', 'Clothing', 'Furniture', 'Books', 'Food', 'Toys']
    
    PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash', 'Check']
    
    ORDER_STATUS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']

def random_date(start_date: datetime.date, end_date: datetime.date) -> str:
    """Generate a random date between start_date and end_date"""
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + datetime.timedelta(days=random_number_of_days)
    return random_date.strftime('%Y-%m-%d')

def random_decimal(min_val: float, max_val: float, decimal_places: int = 2) -> float:
    """Generate a random decimal number between min_val and max_val with specified decimal places"""
    val = random.uniform(min_val, max_val)
    return round(val, decimal_places)

class TableGenerator:
    def __init__(self, db_name: str = ':memory:'):
        """Initialize the generator with a database connection"""
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        
    def __del__(self):
        """Close the database connection when the object is destroyed"""
        if hasattr(self, 'conn'):
            self.conn.close()
    
    def create_customers_table(self, num_rows: int = 50) -> str:
        """Create a customers table with random data"""
        table_name = "customers"
        
        # Create table
        self.cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            customer_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            country TEXT,
            registration_date TEXT
        )
        ''')
        
        # Generate and insert data
        for i in range(1, num_rows + 1):
            first_name = random.choice(DataPool.FIRST_NAMES)
            last_name = random.choice(DataPool.LAST_NAMES)
            email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@example.com"
            country = random.choice(DataPool.COUNTRIES)
            registration_date = random_date(datetime.date(2020, 1, 1), datetime.date(2023, 12, 31))
            
            self.cursor.execute(f'''
            INSERT INTO {table_name} VALUES (?, ?, ?, ?, ?, ?)
            ''', (i, first_name, last_name, email, country, registration_date))
        
        self.conn.commit()
        return table_name
    
    def create_products_table(self, num_rows: int = 30) -> str:
        """Create a products table with random data"""
        table_name = "products"
        
        # Create table
        self.cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            product_id INTEGER PRIMARY KEY,
            product_name TEXT,
            category TEXT,
            price REAL,
            stock_quantity INTEGER
        )
        ''')
        
        # Generate and insert data
        for i in range(1, num_rows + 1):
            category = random.choice(DataPool.PRODUCT_CATEGORIES)
            product_name = f"Product {i} ({category})"
            price = random_decimal(10.0, 1000.0)
            stock_quantity = random.randint(0, 1000)
            
            self.cursor.execute(f'''
            INSERT INTO {table_name} VALUES (?, ?, ?, ?, ?)
            ''', (i, product_name, category, price, stock_quantity))
        
        self.conn.commit()
        return table_name
    
    def create_orders_table(self, num_rows: int = 100, num_customers: int = 50) -> str:
        """Create an orders table with random data"""
        table_name = "orders"
        
        # Create table
        self.cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            order_id INTEGER PRIMARY KEY,
            customer_id INTEGER,
            order_date TEXT,
            total_amount REAL,
            status TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
        ''')
        
        # Generate and insert data
        for i in range(1, num_rows + 1):
            customer_id = random.randint(1, num_customers)
            order_date = random_date(datetime.date(2022, 1, 1), datetime.date(2023, 12, 31))
            total_amount = random_decimal(20.0, 2000.0)
            status = random.choice(DataPool.ORDER_STATUS)
            
            self.cursor.execute(f'''
            INSERT INTO {table_name} VALUES (?, ?, ?, ?, ?)
            ''', (i, customer_id, order_date, total_amount, status))
        
        self.conn.commit()
        return table_name
    
    def create_order_items_table(self, num_orders: int = 100, num_products: int = 30) -> str:
        """Create an order_items table with random data"""
        table_name = "order_items"
        
        # Create table
        self.cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            order_item_id INTEGER PRIMARY KEY,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            unit_price REAL,
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )
        ''')
        
        order_item_id = 1
        # Generate and insert data
        for order_id in range(1, num_orders + 1):
            # Each order will have 1-5 items
            num_items = random.randint(1, 5)
            
            # Get unique product IDs for this order
            products_in_order = random.sample(range(1, num_products + 1), min(num_items, num_products))
            
            for product_id in products_in_order:
                # Query product price from products table
                self.cursor.execute(f'''
                SELECT price FROM products WHERE product_id = ?
                ''', (product_id,))
                
                result = self.cursor.fetchone()
                if result:
                    unit_price = result[0]
                else:
                    unit_price = random_decimal(10.0, 1000.0)
                
                quantity = random.randint(1, 10)
                
                self.cursor.execute(f'''
                INSERT INTO {table_name} VALUES (?, ?, ?, ?, ?)
                ''', (order_item_id, order_id, product_id, quantity, unit_price))
                
                order_item_id += 1
        
        self.conn.commit()
        return table_name
    
    def create_employees_table(self, num_rows: int = 25) -> str:
        """Create an employees table with random data"""
        table_name = "employees"
        
        # Create table
        self.cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            employee_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            department TEXT,
            salary REAL,
            hire_date TEXT
        )
        ''')
        
        # Generate and insert data
        for i in range(1, num_rows + 1):
            first_name = random.choice(DataPool.FIRST_NAMES)
            last_name = random.choice(DataPool.LAST_NAMES)
            department = random.choice(DataPool.DEPARTMENTS)
            salary = random.randint(30000, 120000)
            hire_date = random_date(datetime.date(2015, 1, 1), datetime.date(2023, 12, 31))
            
            self.cursor.execute(f'''
            INSERT INTO {table_name} VALUES (?, ?, ?, ?, ?, ?)
            ''', (i, first_name, last_name, department, salary, hire_date))
        
        self.conn.commit()
        return table_name
    
    def generate_all_tables(self) -> List[str]:
        """Generate all available tables with default settings"""
        tables = []
        
        # Create foundational tables
        tables.append(self.create_customers_table())
        tables.append(self.create_products_table())
        tables.append(self.create_employees_table())
        
        # Create tables that reference the foundational tables
        tables.append(self.create_orders_table())
        tables.append(self.create_order_items_table())
        
        return tables

class SQLLearningApp:
    def __init__(self):
        """Initialize the SQL Learning App"""
        self.db_name = 'sql_learning.db'
        # Remove existing database file if it exists
        if os.path.exists(self.db_name):
            os.remove(self.db_name)
            
        self.generator = TableGenerator(self.db_name)
        self.challenges = self._create_challenges()
        
    def setup(self):
        """Set up the database tables"""
        print("Setting up SQL Learning database...")
        self.generator.generate_all_tables()
        print("Database setup complete!")
    
    def _create_challenges(self) -> List[Dict[str, Any]]:
        """Create SQL challenges for learning"""
        challenges = [
            {
                "title": "Simple Selection",
                "description": "Retrieve all customers from the United States.",
                "hint": "Use the WHERE clause to filter by country.",
                "solution": "SELECT * FROM customers WHERE country = 'USA';"
            },
            {
                "title": "Counting Results",
                "description": "Count how many customers are from each country.",
                "hint": "Use GROUP BY with COUNT function.",
                "solution": "SELECT country, COUNT(*) as customer_count FROM customers GROUP BY country;"
            },
            {
                "title": "Sorting Results",
                "description": "List all products ordered by price from highest to lowest.",
                "hint": "Use ORDER BY with DESC keyword.",
                "solution": "SELECT * FROM products ORDER BY price DESC;"
            },
            {
                "title": "Basic JOIN",
                "description": "Show customer names along with their order details.",
                "hint": "JOIN the customers and orders tables.",
                "solution": "SELECT c.first_name, c.last_name, o.order_id, o.order_date, o.total_amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id;"
            },
            {
                "title": "Multiple JOINs",
                "description": "List all products purchased by each customer.",
                "hint": "JOIN multiple tables: customers, orders, order_items, and products.",
                "solution": "SELECT c.first_name, c.last_name, p.product_name, oi.quantity, oi.unit_price FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id JOIN products p ON oi.product_id = p.product_id;"
            },
            {
                "title": "Aggregation",
                "description": "Find the total amount spent by each customer.",
                "hint": "Use GROUP BY with SUM function.",
                "solution": "SELECT c.customer_id, c.first_name, c.last_name, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name;"
            },
            {
                "title": "Subquery",
                "description": "Find all products that cost more than the average product price.",
                "hint": "Use a subquery with AVG function.",
                "solution": "SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);"
            },
            {
                "title": "HAVING Clause",
                "description": "Find departments that have more than 3 employees.",
                "hint": "Use GROUP BY with HAVING to filter groups.",
                "solution": "SELECT department, COUNT(*) as employee_count FROM employees GROUP BY department HAVING COUNT(*) > 3;"
            },
            {
                "title": "Pivot Table",
                "description": "Create a pivot table showing the count of orders by status.",
                "hint": "Use CASE expressions with aggregate functions.",
                "solution": """SELECT 
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as Pending,
    COUNT(CASE WHEN status = 'Processing' THEN 1 END) as Processing,
    COUNT(CASE WHEN status = 'Shipped' THEN 1 END) as Shipped,
    COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as Delivered,
    COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as Cancelled,
    COUNT(CASE WHEN status = 'Returned' THEN 1 END) as Returned
FROM orders;"""
            },
            {
                "title": "Date Filtering",
                "description": "Find all orders made in the first quarter of 2023.",
                "hint": "Use date functions to filter by year and month.",
                "solution": "SELECT * FROM orders WHERE order_date BETWEEN '2023-01-01' AND '2023-03-31';"
            }
        ]
        return challenges
    
    def display_table_info(self):
        """Display information about the available tables"""
        print("\n=== DATABASE SCHEMA ===")
        self.generator.cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = self.generator.cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            print(f"\nTable: {table_name}")
            
            # Get column information
            self.generator.cursor.execute(f"PRAGMA table_info({table_name});")
            columns = self.generator.cursor.fetchall()
            
            print("Columns:")
            for column in columns:
                col_name = column[1]
                col_type = column[2]
                print(f"  - {col_name} ({col_type})")
            
            # Count rows
            self.generator.cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            row_count = self.generator.cursor.fetchone()[0]
            print(f"Total rows: {row_count}")
            
            # Show a few sample rows
            print("Sample data:")
            self.generator.cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
            sample_rows = self.generator.cursor.fetchall()
            
            for row in sample_rows:
                print(f"  {row}")
    
    def display_challenge(self, challenge_idx: int):
        """Display a specific SQL challenge"""
        if 0 <= challenge_idx < len(self.challenges):
            challenge = self.challenges[challenge_idx]
            print("\n" + "="*60)
            print(f"CHALLENGE {challenge_idx + 1}: {challenge['title']}")
            print("="*60)
            print(f"\n{challenge['description']}")
            print(f"\nHint: {challenge['hint']}")
            print("\nWrite your SQL query to solve this challenge.")
            print("Type 'solution' to see the answer, 'next' for the next challenge, or 'exit' to quit.")
            print("="*60)
    
    def run(self):
        """Run the SQL Learning App"""
        os.system('cls' if os.name == 'nt' else 'clear')
        print("="*60)
        print("WELCOME TO THE SQL LEARNING APP")
        print("="*60)
        print("\nThis app will help you practice SQL with a variety of challenges.")
        print("A database has been created with tables for customers, products, orders, and more.")
        
        self.setup()
        time.sleep(1)
        self.display_table_info()
        
        current_challenge = 0
        self.display_challenge(current_challenge)
        
        while True:
            user_input = input("\n> ").strip()
            
            if user_input.lower() == 'exit':
                print("\nThank you for using the SQL Learning App!")
                break
            elif user_input.lower() == 'solution':
                print("\nSOLUTION:")
                print(self.challenges[current_challenge]['solution'])
            elif user_input.lower() == 'next':
                current_challenge = (current_challenge + 1) % len(self.challenges)
                self.display_challenge(current_challenge)
            elif user_input.lower() == 'tables':
                self.display_table_info()
            elif user_input.lower() == 'help':
                print("\nAvailable commands:")
                print("  solution - Show the solution for the current challenge")
                print("  next     - Go to the next challenge")
                print("  tables   - Display information about database tables")
                print("  help     - Show this help message")
                print("  exit     - Exit the application")
                print("\nYou can also enter a SQL query to execute it.")
            else:
                # Assume it's a SQL query
                try:
                    self.generator.cursor.execute(user_input)
                    rows = self.generator.cursor.fetchall()
                    
                    # Get column names
                    if self.generator.cursor.description:
                        col_names = [desc[0] for desc in self.generator.cursor.description]
                        print("\nResults:")
                        print(" | ".join(col_names))
                        print("-" * (sum(len(name) for name in col_names) + 3 * (len(col_names) - 1)))
                    
                    # Print rows
                    if rows:
                        for row in rows:
                            print(" | ".join(str(col) for col in row))
                        print(f"\n{len(rows)} row(s) returned")
                    else:
                        print("\nQuery executed successfully. No rows returned.")
                        
                except sqlite3.Error as e:
                    print(f"\nError executing SQL: {e}")

if __name__ == "__main__":
    app = SQLLearningApp()
    app.run()