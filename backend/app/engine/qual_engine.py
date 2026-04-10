import hashlib
import random

from app.models.persona import Persona
from app.models.question import Question
from app.llm.llm_adapter import get_llm_adapter, LLMException


class QualEngine:
    """Qualitative response generation using LLM."""
    
    @staticmethod
    def build_persona_prompt(persona: Persona) -> str:
        """Build persona conditioning prompt section."""
        return f"""Persona Profile:
- Age: {persona.age}
- Gender: {persona.gender}
- Location: {persona.location}
- Income Level: {persona.income_band}
- Education: {persona.education_level}
- Risk Tolerance: {persona.risk_tolerance:.2f}
- Brand Loyalty: {persona.brand_loyalty:.2f}
- Price Sensitivity: {persona.price_sensitivity:.2f}
- Innovation Openness: {persona.innovation_openness:.2f}
- Trust in Institutions: {persona.trust_in_institutions:.2f}
- Social Influence: {persona.social_influence:.2f}
- Routine Preference: {persona.routine_preference:.2f}
- Convenience Focus: {persona.convenience_focus:.2f}
- Quality Orientation: {persona.quality_orientation:.2f}"""

    @staticmethod
    def build_fallback_response(
        persona: Persona,
        question: Question,
        seed: int | None = None,
    ) -> tuple[str, dict]:
        """Generate a deterministic fallback answer when no LLM provider is available."""
        seed_material = f"{getattr(persona, 'id', persona.name)}:{getattr(question, 'id', question.question_text)}:{seed or 0}"
        stable_seed = int(hashlib.sha256(seed_material.encode("utf-8")).hexdigest()[:16], 16)
        rng = random.Random(stable_seed)

        stance_score = (
            persona.brand_loyalty
            + persona.innovation_openness
            + persona.risk_tolerance
            + persona.quality_orientation
            - persona.price_sensitivity
            - (persona.routine_preference * 0.5)
        )

        if stance_score >= 1.4:
            opener_options = [
                "I would probably try it fairly quickly.",
                "I'd be open to giving it a shot.",
                "I can see myself trying it soon.",
            ]
            reason_options = [
                "I like testing new products when they feel a bit different from what I already buy.",
                "I'm usually interested when something feels fresh and worth comparing to my usual option.",
                "If it seems like a solid upgrade, I'd want to see how it stacks up.",
            ]
        elif stance_score <= 0.7:
            opener_options = [
                "I would be a little hesitant at first.",
                "I probably would not rush into buying it.",
                "I'd need a clear reason before I switched.",
            ]
            reason_options = [
                "Price matters to me, so I would want to know it is worth it before changing my routine.",
                "I tend to stick with familiar options unless the value is obvious.",
                "I'd compare it carefully with what I already trust before buying.",
            ]
        else:
            opener_options = [
                "I might try it once, but I'd think about it first.",
                "I could see myself testing it, depending on the details.",
                "I'd be open to it if it felt like a sensible choice.",
            ]
            reason_options = [
                "It would come down to whether the taste, price, and packaging felt right for me.",
                "I'd want a good balance between value and something that feels a bit new.",
                "I would compare it with my usual choice and decide if it really offers something better.",
            ]

        packaging_options = [
            "A smaller pack would make it easier for me to try without feeling locked in.",
            "If the packaging feels practical and easy to grab, that helps.",
            "I would pay attention to which size feels like the safest first purchase.",
        ]
        social_options = [
            "I would probably notice what people around me are saying before I decided.",
            "If people in my circle kept recommending it, that would push me closer to trying it.",
            "Seeing others use it confidently would make me more comfortable testing it.",
        ]
        convenience_options = [
            "If it is easy to find and fits smoothly into my routine, I would be much more likely to buy it.",
            "Convenience matters a lot to me, so I would lean toward the option that feels easiest to keep using.",
            "I would pay attention to whether it feels simple and practical enough for regular use.",
        ]
        closing_options = [
            "If the first experience was good, I'd be more likely to buy it again.",
            "After that first try, I'd decide pretty quickly whether it fits my regular habits.",
            "A good first impression would matter a lot for whether I came back to it.",
        ]

        lower_question = question.question_text.lower()
        parts = [rng.choice(opener_options)]

        if "why" in lower_question or "reason" in lower_question:
            parts.append(rng.choice(reason_options))
        elif "friend" in lower_question or "people" in lower_question or "recommend" in lower_question:
            parts.append(rng.choice(social_options))
        elif "easy" in lower_question or "convenient" in lower_question or "routine" in lower_question:
            parts.append(rng.choice(convenience_options))
        elif "package" in lower_question or "size" in lower_question:
            parts.append(rng.choice(packaging_options))
        else:
            parts.append(rng.choice(reason_options))

        parts.append(rng.choice(closing_options))
        response_text = " ".join(parts)

        prompt_history = {
            "provider": "fallback",
            "reason": "No LLM provider configured or provider call failed",
            "response": response_text,
        }
        return response_text, prompt_history
    
    @staticmethod
    async def generate_open_response(
        persona: Persona,
        question: Question,
        response_history: dict | None = None,
        seed: int | None = None,
    ) -> tuple[str, dict]:
        """
        Generate an open-ended response using LLM.
        
        Args:
            persona: Persona object
            question: Question object (must be open-ended type)
            response_history: Optional dict to store prompt history
            
        Returns:
            tuple: (response_text, prompt_history)
            
        Raises:
            LLMException: If LLM call fails
        """
        if question.type != "open":
            raise ValueError("Question must be open-ended type")
        
        # Build system prompt
        system_prompt = """You are simulating a realistic human survey respondent.
Your responses must be:
- Natural and conversational
- Consistent with the given persona characteristics
- First-person perspective
- Maximum 120 words
- Do not explain your reasoning or persona traits

Respond authentically as this persona would."""
        
        # Build user prompt with persona context
        persona_section = QualEngine.build_persona_prompt(persona)
        user_prompt = f"""Please respond to this survey question based on your persona:

{persona_section}

Question: {question.question_text}

Respond naturally as this person would, in first person:"""
        
        try:
            adapter = get_llm_adapter()
            response_text = await adapter.generate_text(
                system=system_prompt,
                user=user_prompt,
                temperature=0.7,
                max_tokens=150,  # Slightly higher to capture full response
            )

            words = response_text.split()
            if len(words) > 120:
                response_text = " ".join(words[:120]) + "..."

            prompt_history = {
                "provider": "llm",
                "system": system_prompt,
                "user": user_prompt,
                "response": response_text,
            }
            return response_text, prompt_history

        except LLMException:
            return QualEngine.build_fallback_response(persona, question, seed=seed)
        except Exception:
            return QualEngine.build_fallback_response(persona, question, seed=seed)


if __name__ == "__main__":
    # Quick test structure (requires async context)
    print("QualEngine loaded - use with simulation service")
