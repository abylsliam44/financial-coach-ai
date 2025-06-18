from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Query
from datetime import datetime, date
from typing import Optional, List
from models import Transaction

def apply_transaction_filters(
    query: Query,
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search_text: Optional[str] = None
) -> Query:
    """
    Apply filters to transaction query
    
    Args:
        query: Base SQLAlchemy query
        transaction_type: Filter by "income" or "expense"
        category: Filter by category name
        start_date: Filter transactions from this date
        end_date: Filter transactions until this date
        search_text: Search in description and category
    
    Returns:
        Filtered query
    """
    
    # Filter by transaction type
    if transaction_type:
        if transaction_type.lower() not in ["income", "expense"]:
            raise ValueError("Transaction type must be 'income' or 'expense'")
        query = query.filter(Transaction.type == transaction_type.lower())
    
    # Filter by category
    if category:
        query = query.filter(Transaction.category == category)
    
    # Filter by date range
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    
    if end_date:
        # Add one day to include the end date
        end_date_plus_one = datetime.combine(end_date, datetime.max.time())
        query = query.filter(Transaction.date <= end_date_plus_one)
    
    # Search in description and category
    if search_text:
        search_filter = or_(
            Transaction.description.ilike(f"%{search_text}%"),
            Transaction.category.ilike(f"%{search_text}%")
        )
        query = query.filter(search_filter)
    
    return query

def get_summary_filters(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List:
    """
    Get filters for summary queries
    
    Args:
        start_date: Filter from this date
        end_date: Filter until this date
    
    Returns:
        List of filter conditions
    """
    filters = []
    
    if start_date:
        filters.append(Transaction.date >= start_date)
    
    if end_date:
        end_date_plus_one = datetime.combine(end_date, datetime.max.time())
        filters.append(Transaction.date <= end_date_plus_one)
    
    return filters 