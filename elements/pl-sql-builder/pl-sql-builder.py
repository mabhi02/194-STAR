import random
import chevron
import lxml.html
import prairielearn as pl
import json

def prepare(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    required_attribs = []
    optional_attribs = [
        'schema', 
        'init-sql', 
        'editable', 
        'show-schema', 
        'show-relationships',
        'show-run-button',
        'show-reset-button'
    ]
    pl.check_attribs(element, required_attribs, optional_attribs)
    
    # Get schema and initialization SQL if provided
    schema = pl.get_string_attrib(element, 'schema', '[]')
    init_sql = pl.get_string_attrib(element, 'init-sql', '')
    editable = pl.get_boolean_attrib(element, 'editable', True)
    show_schema = pl.get_boolean_attrib(element, 'show-schema', True)
    show_relationships = pl.get_boolean_attrib(element, 'show-relationships', True)
    show_run_button = pl.get_boolean_attrib(element, 'show-run-button', True)
    show_reset_button = pl.get_boolean_attrib(element, 'show-reset-button', True)
    
    # Validate and parse schema JSON
    try:
        schema_json = json.loads(schema)
        # Re-encode to ensure proper escaping
        schema = json.dumps(schema_json)
    except json.JSONDecodeError:
        raise ValueError('Invalid schema JSON')
    
    # Store in data for rendering
    data['params']['schema'] = schema
    data['params']['init_sql'] = init_sql.replace('"', '&quot;')
    data['params']['editable'] = editable
    data['params']['show_schema'] = show_schema
    data['params']['show_relationships'] = show_relationships
    data['params']['show_run_button'] = show_run_button
    data['params']['show_reset_button'] = show_reset_button
    
    return data

def render(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    
    html_params = {
        'schema': data['params']['schema'],
        'init_sql': data['params']['init_sql'],
        'editable': data['params']['editable'],
        'show_schema': data['params']['show_schema'],
        'show_relationships': data['params']['show_relationships'],
        'show_run_button': data['params']['show_run_button'],
        'show_reset_button': data['params']['show_reset_button'],
        'uuid': pl.get_uuid()
    }
    
    with open('pl-sql-builder.mustache', 'r') as f:
        return chevron.render(f, html_params).strip()

def generate(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    uuid = pl.get_uuid()

    # Get schema and init SQL from element attributes
    schema = json.loads(element.get('schema', '[]'))
    init_sql = element.get('init-sql', '')
    editable = pl.get_boolean_attrib(element, 'editable', True)
    show_schema = pl.get_boolean_attrib(element, 'show-schema', True)
    show_relationships = pl.get_boolean_attrib(element, 'show-relationships', True)
    show_run_button = pl.get_boolean_attrib(element, 'show-run-button', True)
    show_reset_button = pl.get_boolean_attrib(element, 'show-reset-button', True)

    # Validate schema
    if not isinstance(schema, list):
        raise ValueError('Schema must be a list of table definitions')
    
    for table in schema:
        if not isinstance(table, dict):
            raise ValueError('Each table definition must be a dictionary')
        if 'name' not in table:
            raise ValueError('Each table must have a name')
        if 'columns' not in table:
            raise ValueError('Each table must have columns')

    # Create the SQL builder element
    html_params = {
        'uuid': uuid,
        'schema': json.dumps(schema),
        'init_sql': init_sql,
        'editable': editable,
        'show_schema': show_schema,
        'show_relationships': show_relationships,
        'show_run_button': show_run_button,
        'show_reset_button': show_reset_button
    }

    with open('pl-sql-builder.mustache', 'r') as f:
        template = f.read()
    
    return chevron.render(template, html_params)