import random
import chevron
import lxml.html
import prairielearn as pl

def prepare(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    required_attribs = []
    optional_attribs = ['schema', 'init-sql']
    pl.check_attribs(element, required_attribs, optional_attribs)
    
    # Get schema and initialization SQL if provided
    schema = pl.get_string_attrib(element, 'schema', '[]')
    init_sql = pl.get_string_attrib(element, 'init-sql', '')
    
    # Store in data for rendering
    data['params']['schema'] = schema
    data['params']['init_sql'] = init_sql
    
    return data

def render(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    
    html_params = {
        'schema': data['params']['schema'],
        'init_sql': data['params']['init_sql'],
        'uuid': pl.get_uuid()
    }
    
    with open('pl-sql-builder.mustache', 'r') as f:
        return chevron.render(f, html_params).strip() 