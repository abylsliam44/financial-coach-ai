import os
from typing import Dict
from openai import AsyncOpenAI, APIError
from fastapi import HTTPException
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AICoachService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")
        
        # Log configuration status (without exposing the actual API key)
        logger.info(f"Initializing AICoachService with model: {self.model}")
        logger.info(f"API Key status: {'Present' if self.api_key else 'Missing'}")
        
        if not self.api_key:
            logger.error("OpenAI API key not found in environment variables")
            raise ValueError("OpenAI API key not found in environment variables")
            
        try:
            self.client = AsyncOpenAI(api_key=self.api_key)
            logger.info("Successfully initialized AsyncOpenAI client")
        except Exception as e:
            logger.error(f"Failed to initialize AsyncOpenAI client: {str(e)}")
            raise

    async def get_financial_advice(self, message: str, user_profile: Dict) -> str:
        try:
            logger.info(f"Generating financial advice for message: {message[:50]}...")
            
            # Create a detailed financial context from the user's profile
            profile_context = (
                f"Financial Context:\n"
                f"- Monthly Income: ${user_profile.get('monthly_income', 'N/A')}\n"
                f"- Current Savings: ${user_profile.get('current_savings', 'N/A')}\n"
                f"- Savings Goals: ${user_profile.get('savings_goal', 'N/A')}\n"
                f"- Active Goals: {user_profile.get('financial_goals', 'None set')}\n"
            )

            # Create a comprehensive system prompt for the financial coach
            system_prompt = """You are an empathetic and knowledgeable financial coach. Your role is to:
- Provide actionable, personalized financial advice
- Help users develop better spending habits and achieve their financial goals
- Offer positive reinforcement while maintaining realistic expectations
- Give specific, practical suggestions based on the user's financial situation
- Focus on both short-term actions and long-term financial well-being"""

            logger.info(f"Making API call to OpenAI with model: {self.model}")
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{profile_context}\n\nUser Question: {message}"}
                ],
                temperature=0.7,
                max_tokens=500,
                n=1
            )
            logger.info("Successfully received response from OpenAI")

            return completion.choices[0].message.content

        except APIError as e:
            logger.error(f"OpenAI API Error: {str(e)}")
            error_detail = f"OpenAI API Error: {str(e)}"
            if "invalid_api_key" in str(e).lower():
                error_detail = "Invalid API key. Please check your OpenAI API key configuration."
            elif "model not found" in str(e).lower():
                error_detail = f"Model '{self.model}' not found. Please check your model configuration."
            raise HTTPException(
                status_code=503,
                detail=error_detail
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_financial_advice: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"AI service error: {str(e)}"
            )

# Create a singleton instance
try:
    ai_coach_service = AICoachService()
except Exception as e:
    logger.error(f"Failed to initialize AICoachService: {str(e)}")
    # Don't raise here - let FastAPI handle the error when the service is used 