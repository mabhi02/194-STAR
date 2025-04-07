import prairielearn as pl
import lxml.html
import json
import chevron
import os
import random
import base64
import re

def prepare(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    required_attribs = ['answers-name']
    optional_attribs = ['title', 'schema', 'init-sql', 'question-file', 'show-reset', 'show-builder']
    pl.check_attribs(element, required_attribs, optional_attribs)
    
    # Get the answers name
    answers_name = pl.get_string_attrib(element, 'answers-name')
    
    # Initialize user's answer
    if data['panel'] == 'question':
        data['params'][answers_name] = None
    
    # Get title
    title = pl.get_string_attrib(element, 'title', 'SQL Quiz')
    data['params']['title'] = title
    
    # Get schema (if provided)
    schema = pl.get_string_attrib(element, 'schema', '[]')
    data['params']['schema'] = schema
    
    # Get initialization SQL (if provided)
    init_sql = pl.get_string_attrib(element, 'init-sql', '')
    data['params']['init_sql'] = init_sql
    
    # Check if we should show reset button
    show_reset = pl.get_boolean_attrib(element, 'show-reset', True)
    data['params']['show_reset'] = show_reset
    
    # Check if we should show query builder
    show_builder = pl.get_boolean_attrib(element, 'show-builder', True)
    data['params']['show_builder'] = show_builder
    
    # Get questions from file or element children
    question_file = pl.get_string_attrib(element, 'question-file', None)
    if question_file is not None:
        # Look for the file in the serverFilesQuestion directory
        question_path = os.path.join(data['options']['question_path'], 'serverFilesQuestion', question_file)
        if os.path.exists(question_path):
            with open(question_path, 'r', encoding='utf-8') as f:
                questions_data = json.load(f)
                data['params']['questions'] = json.dumps(questions_data.get('questions', []))
                # Override other parameters if provided in the file
                if 'schema' in questions_data:
                    data['params']['schema'] = json.dumps(questions_data['schema'])
                if 'initSql' in questions_data:
                    data['params']['init_sql'] = questions_data['initSql']
                if 'title' in questions_data:
                    data['params']['title'] = questions_data['title']
        else:
            raise ValueError(f"Question file '{question_file}' not found")
    else:
        # Get questions from child elements
        questions = []
        for child in element:
            if child.tag == 'pl-sql-question':
                question = {}
                question['id'] = len(questions) + 1
                question['title'] = pl.get_string_attrib(child, 'title', f"Question {len(questions) + 1}")
                question['description'] = pl.get_string_attrib(child, 'description', '')
                question['level'] = pl.get_string_attrib(child, 'level', 'medium')
                question['type'] = pl.get_string_attrib(child, 'type', 'multiple-choice')
                question['explanation'] = pl.get_string_attrib(child, 'explanation', '')
                
                # Handle different question types
                if question['type'] == 'multiple-choice':
                    options = []
                    correct_answer = -1
                    
                    for i, option_child in enumerate(child.findall('./pl-sql-option')):
                        option_text = option_child.text.strip()
                        options.append(option_text)
                        if pl.get_boolean_attrib(option_child, 'correct', False):
                            correct_answer = i
                    
                    question['options'] = options
                    question['correctAnswer'] = correct_answer
                
                elif question['type'] == 'drag-drop':
                    segments = []
                    correct_order = []
                    
                    for i, segment_child in enumerate(child.findall('./pl-sql-segment')):
                        segment_text = segment_child.text.strip()
                        segments.append(segment_text)
                        
                        order = pl.get_integer_attrib(segment_child, 'order', -1)
                        if order >= 0:
                            # Ensure the correct_order list has enough space
                            while len(correct_order) <= order:
                                correct_order.append(None)
                            correct_order[order] = i
                    
                    question['segments'] = segments
                    question['correctOrder'] = correct_order
                
                elif question['type'] == 'fill-in-blanks':
                    question['template'] = pl.get_string_attrib(child, 'template', '')
                    
                    blanks = {}
                    correct_answers = {}
                    
                    for blank_child in child.findall('./pl-sql-blank'):
                        blank_name = pl.get_string_attrib(blank_child, 'name', '')
                        blank_options = pl.get_string_attrib(blank_child, 'options', '').split('|')
                        correct = pl.get_string_attrib(blank_child, 'correct', '')
                        
                        blanks[blank_name] = blank_options
                        correct_answers[blank_name] = correct
                    
                    question['blanks'] = blanks
                    question['correctAnswers'] = correct_answers
                
                elif question['type'] == 'build-query':
                    segments = []
                    correct_answers = []
                    
                    for segment_child in child.findall('./pl-sql-segment'):
                        segment_type = pl.get_string_attrib(segment_child, 'type', 'static')
                        segment = {
                            'type': segment_type
                        }
                        
                        if segment_type == 'static':
                            segment['value'] = segment_child.text.strip()
                        elif segment_type == 'select':
                            options = []
                            correct_index = -1
                            
                            for i, option_child in enumerate(segment_child.findall('./pl-sql-option')):
                                option_text = option_child.text.strip()
                                options.append(option_text)
                                if pl.get_boolean_attrib(option_child, 'correct', False):
                                    correct_index = i
                            
                            segment['options'] = options
                            correct_answers.append(correct_index)
                        
                        segments.append(segment)
                    
                    question['segments'] = segments
                    question['correctAnswers'] = correct_answers
                
                questions.append(question)
        
        # Randomize the questions
        random.shuffle(questions)
        data['params']['questions'] = json.dumps(questions)
    
    return data

def render(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    answers_name = pl.get_string_attrib(element, 'answers-name')
    
    html_params = {
        'answers_name': answers_name,
        'title': data['params']['title'],
        'schema': data['params']['schema'],
        'init_sql': data['params']['init_sql'],
        'questions': data['params']['questions'],
        'show_reset': data['params']['show_reset'],
        'show_builder': data['params']['show_builder'],
        'uuid': pl.get_uuid()
    }

    with open('pl-sql-quiz.mustache', 'r', encoding='utf-8') as f:
        html = chevron.render(f, html_params).strip()
    
    return html

def parse(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    answers_name = pl.get_string_attrib(element, 'answers-name')
    
    # Get submitted answer or return parse_error if it does not exist
    if data['submitted_answers'].get(answers_name, None) is None:
        data['format_errors'][answers_name] = 'No answer was submitted.'
        return
    
    # Parse the student's answer
    try:
        student_answer = json.loads(data['submitted_answers'][answers_name])
        
        # Validate the structure of the answer
        if not isinstance(student_answer, dict):
            data['format_errors'][answers_name] = 'Invalid answer format.'
            return
        
        # Expected fields in the answer
        required_fields = ['questions', 'score']
        for field in required_fields:
            if field not in student_answer:
                data['format_errors'][answers_name] = f'Missing "{field}" in the answer.'
                return
        
        # Further validation can be added here if needed
        
    except json.JSONDecodeError:
        data['format_errors'][answers_name] = 'Invalid JSON format.'
        return
    
    return

def grade(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    answers_name = pl.get_string_attrib(element, 'answers-name')
    
    # Get submitted answer
    student_answer = json.loads(data['submitted_answers'][answers_name])
    
    # Extract student's score
    total_questions = len(student_answer['questions'])
    correct_answers = student_answer['score']
    
    # Calculate the final score (0 to 1)
    final_score = correct_answers / total_questions if total_questions > 0 else 0
    
    # Store the score and feedback
    data['partial_scores'][answers_name] = {
        'score': final_score,
        'feedback': f'You got {correct_answers} out of {total_questions} questions correct.'
    }
    
    return

def test(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    answers_name = pl.get_string_attrib(element, 'answers-name')
    
    # Create a perfect submission for testing
    questions = json.loads(data['params']['questions'])
    total_questions = len(questions)
    
    test_answer = {
        'questions': questions,
        'score': total_questions  # Perfect score
    }
    
    data['submitted_answers'][answers_name] = json.dumps(test_answer)
    
    return