import os
from typing import List, Dict, Any
from openai import AsyncOpenAI
import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

SYSTEM_PROMPT = (
    "You are Financial Coach AI, a warm, friendly, and supportive personal finance assistant. "
    "Give practical, non-judgmental, and encouraging advice. "
    "Base your answers on the user's spending habits, goals, and recent transactions. "
    "Always be positive and helpful, and never shame the user."
)

# ✅ create OpenAI async client (fixes 'proxies' error)
client = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
    http_client=httpx.AsyncClient()
)

def build_user_context(user: Dict[str, Any], transactions: List[Dict[str, Any]], goals: List[Dict[str, Any]]) -> str:
    context = f"User: {user.get('username', 'Unknown')}\n"
    context += f"Goals: {goals}\n"
    context += f"Recent transactions: {transactions}\n"
    return context

async def get_financial_advice(user: Dict[str, Any], message: str, transactions: List[Dict[str, Any]], goals: List[Dict[str, Any]]) -> str:
    if not OPENAI_API_KEY:
        return "AI service is not available. Please contact support."
    try:
        user_context = build_user_context(user, transactions, goals)
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_context},
                {"role": "user", "content": message}
            ],
            max_tokens=300,
            temperature=0.7,
            timeout=20,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"AI service unavailable: {str(e)}"
