import httpx
import asyncio
from typing import Optional
from app.config import get_settings

settings = get_settings()


class LLMException(Exception):
    """Base exception for LLM operations."""
    pass


class GroqProvider:
    """Groq API provider."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "mixtral-8x7b-32768"  # Free tier model
    
    async def call(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 150,
        timeout_seconds: int = 30,
    ) -> str:
        """Call Groq API."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(
                self.endpoint,
                json=payload,
                headers=headers,
            )
            
            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]


class OpenRouterProvider:
    """OpenRouter API provider."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-2-7b-chat"  # Free tier model
    
    async def call(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 150,
        timeout_seconds: int = 30,
    ) -> str:
        """Call OpenRouter API."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(
                self.endpoint,
                json=payload,
                headers=headers,
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenRouter API error: {response.status_code}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]


class LocalProvider:
    """Local LLM endpoint provider."""
    
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
    
    async def call(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 150,
        timeout_seconds: int = 30,
    ) -> str:
        """Call local LLM endpoint."""
        payload = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(
                f"{self.endpoint}/v1/chat/completions",
                json=payload,
            )
            
            if response.status_code != 200:
                raise Exception(f"Local LLM error: {response.status_code}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]


class LLMAdapter:
    """Provider-agnostic LLM adapter with fallback support."""
    
    def __init__(self):
        self.providers = []
        
        # Try to initialize Groq
        if settings.groq_api_key:
            self.providers.append(("groq", GroqProvider(settings.groq_api_key)))
        
        # Try to initialize OpenRouter
        if settings.openrouter_api_key:
            self.providers.append(("openrouter", OpenRouterProvider(settings.openrouter_api_key)))
        
        # Try to initialize local endpoint
        if settings.local_llm_endpoint:
            self.providers.append(("local", LocalProvider(settings.local_llm_endpoint)))
        
        if not self.providers:
            raise LLMException("No LLM providers configured")
    
    async def generate_text(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 150,
    ) -> str:
        """
        Generate text using first available provider with automatic fallback.
        
        Args:
            system: System prompt for LLM
            user: User prompt/question
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            str: Generated text response
            
        Raises:
            LLMException: If all providers fail
        """
        timeout_seconds = settings.llm_timeout_seconds
        max_retries = settings.llm_max_retries
        
        last_error = None
        
        for provider_name, provider in self.providers:
            for attempt in range(max_retries):
                try:
                    response = await provider.call(
                        system=system,
                        user=user,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        timeout_seconds=timeout_seconds,
                    )
                    return response
                
                except asyncio.TimeoutError:
                    last_error = f"{provider_name}: timeout"
                    wait_time = 2 ** attempt  # Exponential backoff
                    if attempt < max_retries - 1:
                        await asyncio.sleep(wait_time)
                
                except Exception as e:
                    last_error = f"{provider_name}: {str(e)}"
                    wait_time = 2 ** attempt
                    if attempt < max_retries - 1:
                        await asyncio.sleep(wait_time)
        
        raise LLMException(
            f"All LLM providers failed. Last error: {last_error}"
        )


# Global instance
_adapter = None


def get_llm_adapter() -> LLMAdapter:
    """Get or create global LLM adapter instance."""
    global _adapter
    if _adapter is None:
        _adapter = LLMAdapter()
    return _adapter
