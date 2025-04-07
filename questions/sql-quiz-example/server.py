import prairielearn as pl
import json
import random

def generate(data):
    # Nothing specific to generate for this question
    return data

def grade(data):
    # Get submitted answer
    sql_quiz_answers = data['submitted_answers'].get('sql-quiz-1', None)
    
    if sql_quiz_answers is None:
        # No answer was submitted
        data['partial_scores']['sql-quiz-1'] = {
            'score': 0,
            'feedback': 'No answer was submitted.'
        }
        return
        
    try:
        # Parse the student's answers
        student_data = json.loads(sql_quiz_answers)
        
        # Extract score from the submitted data
        total_questions = len(student_data['questions'])
        correct_answers = student_data['score']
        
        # Calculate the percentage
        score_percentage = correct_answers / total_questions if total_questions > 0 else 0
        
        # Store the score and feedback
        data['partial_scores']['sql-quiz-1'] = {
            'score': score_percentage,
            'feedback': f'You got {correct_answers} out of {total_questions} questions correct ({int(score_percentage * 100)}%).'
        }
        
        # Add overall feedback
        if score_percentage == 1.0:
            data['feedback'] = {
                'correct': True,
                'message': 'Excellent work! You have demonstrated a strong understanding of SQL queries.'
            }
        elif score_percentage >= 0.8:
            data['feedback'] = {
                'correct': True,
                'message': 'Good job! You understand most SQL concepts but might want to review the ones you missed.'
            }
        elif score_percentage >= 0.5:
            data['feedback'] = {
                'correct': True,
                'message': 'You\'re making progress but should review SQL fundamentals to improve your understanding.'
            }
        else:
            data['feedback'] = {
                'correct': False,
                'message': 'You need to spend more time learning SQL basics. Try reviewing the course materials and tutorials.'
            }
            
    except (json.JSONDecodeError, KeyError) as e:
        # Error parsing the answer
        data['partial_scores']['sql-quiz-1'] = {
            'score': 0,
            'feedback': f'Error grading submission: {str(e)}'
        }