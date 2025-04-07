import random
import chevron

def prepare(element_html, data):
    # Add any random or dynamic data you want
    data['params']['question_id'] = random.randint(100, 999)
    data['params']['table'] = random.choice(['customers', 'orders'])

    return data

def render(element_html, data):
    # Construct the dictionary of parameters
    html_params = {
        'question_id': data['params']['question_id'],
        'table': data['params']['table'],
        # If you want to pass more dynamic fields, do it here
    }

    # Render the mustache file with chevron
    with open('cs194custom.mustache', 'r') as f:
        return chevron.render(f, html_params).strip()
