"""
Comprehensive Error Handling and Crash Prevention System
"""
import logging
import traceback
from functools import wraps
from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from werkzeug.exceptions import HTTPException
import json

logger = logging.getLogger(__name__)


# ============================================================================
# GLOBAL ERROR HANDLERS
# ============================================================================

def register_error_handlers(app, db):
    """Register all error handlers with Flask app"""

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Catch-all handler for any unhandled exception"""
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)

        # Rollback any pending database transaction
        try:
            db.session.rollback()
        except:
            pass

        # Don't expose internal errors in production
        if app.config.get('DEBUG'):
            return jsonify({
                'error': str(error),
                'type': type(error).__name__,
                'traceback': traceback.format_exc()
            }), 500
        else:
            return jsonify({
                'error': 'An unexpected error occurred. Please try again later.',
                'code': 'internal_server_error'
            }), 500

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        """Handle all database errors"""
        logger.error(f"Database error: {str(error)}", exc_info=True)
        db.session.rollback()

        if isinstance(error, IntegrityError):
            return jsonify({
                'error': 'Data integrity violation. This record may already exist.',
                'code': 'integrity_error'
            }), 409
        elif isinstance(error, OperationalError):
            return jsonify({
                'error': 'Database connection error. Please try again later.',
                'code': 'database_unavailable'
            }), 503
        else:
            return jsonify({
                'error': 'Database error occurred.',
                'code': 'database_error'
            }), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle HTTP exceptions (404, 403, etc.)"""
        return jsonify({
            'error': error.description,
            'code': error.name.lower().replace(' ', '_')
        }), error.code

    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle validation errors"""
        logger.warning(f"Validation error: {str(error)}")
        return jsonify({
            'error': str(error),
            'code': 'validation_error'
        }), 400

    @app.errorhandler(KeyError)
    def handle_key_error(error):
        """Handle missing required fields"""
        logger.warning(f"Missing field: {str(error)}")
        return jsonify({
            'error': f'Missing required field: {str(error)}',
            'code': 'missing_field'
        }), 400

    @app.errorhandler(TypeError)
    def handle_type_error(error):
        """Handle type errors"""
        logger.error(f"Type error: {str(error)}", exc_info=True)
        return jsonify({
            'error': 'Invalid data type provided',
            'code': 'type_error'
        }), 400

    @app.errorhandler(json.JSONDecodeError)
    def handle_json_error(error):
        """Handle JSON parsing errors"""
        logger.warning(f"Invalid JSON: {str(error)}")
        return jsonify({
            'error': 'Invalid JSON format',
            'code': 'json_error'
        }), 400


# ============================================================================
# DECORATORS FOR ERROR HANDLING
# ============================================================================

def with_db_error_handling(f):
    """Decorator to add database error handling and automatic rollback"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except SQLAlchemyError as e:
            from flask import current_app
            current_app.extensions['sqlalchemy'].session.rollback()
            logger.error(f"Database error in {f.__name__}: {str(e)}", exc_info=True)
            return jsonify({'error': 'Database operation failed'}), 500
        except Exception as e:
            from flask import current_app
            current_app.extensions['sqlalchemy'].session.rollback()
            logger.error(f"Error in {f.__name__}: {str(e)}", exc_info=True)
            raise
    return decorated_function


def with_error_logging(f):
    """Decorator to add comprehensive error logging"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(
                f"Error in {f.__name__}: {str(e)}",
                exc_info=True,
                extra={
                    'function': f.__name__,
                    'args': str(args)[:200],  # Limit to avoid huge logs
                    'kwargs': str(kwargs)[:200]
                }
            )
            raise
    return decorated_function


def safe_json_parse(data, default=None):
    """Safely parse JSON with fallback"""
    if not data:
        return default or {}

    try:
        if isinstance(data, str):
            return json.loads(data)
        return data
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return default or {}


def safe_int(value, default=0):
    """Safely convert to integer with fallback"""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value, default=0.0):
    """Safely convert to float with fallback"""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_division(numerator, denominator, default=0):
    """Safely perform division with zero check"""
    try:
        if denominator == 0:
            return default
        return numerator / denominator
    except (TypeError, ValueError):
        return default


# ============================================================================
# REQUEST VALIDATION HELPERS
# ============================================================================

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present"""
    if not data:
        raise ValueError("Request data is required")

    missing_fields = [field for field in required_fields if field not in data or data[field] is None]

    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    return True


def validate_email(email):
    """Basic email validation"""
    if not email or '@' not in email or '.' not in email:
        raise ValueError("Invalid email format")
    return True


def validate_pagination(page, per_page, max_per_page=100):
    """Validate and sanitize pagination parameters"""
    try:
        page = max(1, min(int(page), 10000))  # Limit to reasonable range
        per_page = max(1, min(int(per_page), max_per_page))
        return page, per_page
    except (ValueError, TypeError):
        return 1, 25  # Default values


# ============================================================================
# EXTERNAL API CALL WRAPPERS
# ============================================================================

def safe_api_call(func, *args, **kwargs):
    """Safely call external API with error handling"""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"External API call failed: {str(e)}", exc_info=True)
        return None


# ============================================================================
# DATABASE TRANSACTION CONTEXT MANAGER
# ============================================================================

class DatabaseTransaction:
    """Context manager for safe database transactions"""

    def __init__(self, db_session):
        self.db_session = db_session

    def __enter__(self):
        return self.db_session

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Exception occurred, rollback
            self.db_session.rollback()
            logger.error(f"Transaction rolled back due to {exc_type.__name__}: {exc_val}")
            return False  # Re-raise exception
        else:
            # No exception, commit
            try:
                self.db_session.commit()
            except Exception as e:
                self.db_session.rollback()
                logger.error(f"Commit failed: {e}", exc_info=True)
                raise
        return True
