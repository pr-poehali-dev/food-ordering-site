import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage restaurant orders - create new orders and fetch all orders for waiter
    Args: event with httpMethod (GET/POST/OPTIONS), body with order data
    Returns: HTTP response with orders list or created order confirmation
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("""
            SELECT id, items, total, status, created_at 
            FROM orders 
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        
        orders = []
        for row in rows:
            orders.append({
                'id': row[0],
                'items': row[1],
                'total': float(row[2]),
                'status': row[3],
                'created_at': row[4].isoformat() if row[4] else None
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'orders': orders})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        items = body_data.get('items', [])
        total = body_data.get('total', 0)
        
        cur.execute("""
            INSERT INTO orders (items, total, status) 
            VALUES (%s, %s, %s) 
            RETURNING id, created_at
        """, (json.dumps(items), total, 'новый'))
        
        result = cur.fetchone()
        order_id = result[0]
        created_at = result[1]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'order_id': order_id,
                'created_at': created_at.isoformat()
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }
