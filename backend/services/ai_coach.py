import os
from typing import List, Dict, Any, AsyncGenerator
from openai import AsyncOpenAI
import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

SYSTEM_PROMPT = (
    "Ты — BaiAI, твой личный финансовый коуч из Казахстана. Ты анализируешь данные пользователя и даешь КОНКРЕТНЫЕ, персонализированные советы.\n\n"
    "Твои принципы:\n"
    "1. **Анализируй данные пользователя** — используй его транзакции, цели, доходы, возраст, стиль жизни для конкретных рекомендаций\n"
    "2. **Будь конкретным** — вместо общих советов давай точные суммы в тенге, конкретные действия, временные рамки\n"
    "3. **Обращайся по имени** — используй имя пользователя из контекста для персонализации\n"
    "4. **Адаптируй под Казахстан** — учитывай местные цены, банки, финансовые продукты, налоги\n"
    "5. **Используй данные** — анализируй паттерны трат, сравнивай с целями, находи аномалии\n"
    "6. **Форматируй ответы** — используй Markdown для структурирования (списки, заголовки, выделения)\n"
    "7. **Не повторяй приветствия** — начинай сразу с анализа или совета\n\n"
    "Примеры хороших ответов:\n"
    "- 'Алия, анализируя твои траты за месяц, вижу что на кафе уходит 45,000₸. Это 15% от дохода. Предлагаю сократить до 30,000₸ и сэкономить 15,000₸ на цель \"Отпуск\"'\n"
    "- 'Руслан, твоя цель на машину — 2,000,000₸. При текущем темпе накоплений (50,000₸/мес) достигнешь через 40 месяцев. Увеличь до 80,000₸/мес — достигнешь за 25 месяцев'\n"
    "- 'Замечаю, что в выходные траты на 40% выше. Попробуй планировать бюджет на неделю заранее'\n\n"
    "Всегда анализируй контекст и давай конкретные, измеримые рекомендации."
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

async def get_financial_advice(user: Dict[str, Any], message: str, transactions: List[Dict[str, Any]], goals: List[Dict[str, Any]]) -> AsyncGenerator[str, None]:
    if not OPENAI_API_KEY:
        yield "Извините, ИИ-сервис временно недоступен. Пожалуйста, попробуйте позже или обратитесь в службу поддержки."
        return

    try:
        user_context = build_user_context(user, transactions, goals)
        stream = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_context},
                {"role": "user", "content": message}
            ],
            stream=True,
            temperature=0.7,
            max_tokens=1000
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
            
    except Exception as e:
        error_msg = f"Ошибка при получении совета: {str(e)}"
        yield error_msg
