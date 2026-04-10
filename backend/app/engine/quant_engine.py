import random
from typing import Optional, List
from app.models.persona import Persona


class QuantEngine:
    """Deterministic quantitative response simulation engine."""
    
    @staticmethod
    def simulate_likert_response(persona: Persona, seed: Optional[int] = None) -> int:
        """
        Simulate a Likert scale response (1-5) based on persona psychographics.
        
        Formula:
        score = 3 + (brand_loyalty × 1.2) + (price_sensitivity × 1.0) + N(0, 0.5)
        Clamped to [1, 5], rounded to integer.
        
        Args:
            persona: Persona object with psychographics
            seed: Optional seed for reproducibility
            
        Returns:
            int: Likert score (1-5)
        """
        if seed is not None:
            random.seed(seed)
        
        # Base score with psychographic influence
        score = 3.0
        score += persona.brand_loyalty * 1.1
        score += persona.price_sensitivity * 0.8
        score += persona.quality_orientation * 0.5
        score -= persona.routine_preference * 0.4
        
        # Add controlled noise
        noise = random.gauss(0, 0.5)
        score += noise
        
        # Clamp to [1, 5] and round
        score = max(1.0, min(5.0, score))
        return round(score)
    
    @staticmethod
    def simulate_mcq_response(persona: Persona, options: List[str], seed: Optional[int] = None) -> int:
        """
        Simulate an MCQ response based on persona traits and option weights.
        
        Weighting logic:
        - Lower price_sensitivity → higher preference for premium options
        - Higher innovation_openness → higher preference for newer options
        - Higher brand_loyalty → higher preference for brand-standard options
        
        Args:
            persona: Persona object
            options: List of option strings
            seed: Optional seed for reproducibility
            
        Returns:
            int: Index of selected option (0-based)
        """
        if seed is not None:
            random.seed(seed)
        
        # Create weights based on option position and persona traits
        weights = []
        num_options = len(options)
        
        for i, option in enumerate(options):
            # Base weight increases with position (later options are more novel/premium)
            position_weight = 0.5 + (i / num_options) * 1.5
            
            # Persona influence
            # Higher innovation_openness → prefer later options (premium/new)
            innovation_boost = persona.innovation_openness * 0.5 * (i / num_options)
            
            # Higher price_sensitivity → prefer earlier options (cheaper)
            price_penalty = persona.price_sensitivity * 0.3 * ((num_options - i) / num_options)
            
            # Brand loyalty → prefer middle options (safe choice)
            if i == num_options // 2:
                brand_boost = persona.brand_loyalty * 0.3
            else:
                brand_boost = 0

            convenience_boost = persona.convenience_focus * 0.25 * ((num_options - i) / num_options)
            quality_boost = persona.quality_orientation * 0.35 * (i / num_options)
            social_boost = persona.social_influence * 0.2 if "popular" in option.lower() or "recommended" in option.lower() else 0
            
            final_weight = max(
                0.1,
                position_weight + innovation_boost - price_penalty + brand_boost + convenience_boost + quality_boost + social_boost,
            )
            weights.append(final_weight)
        
        # Normalize weights to probabilities
        total = sum(weights)
        probabilities = [w / total for w in weights]
        
        # Select option using weighted random choice
        selected_index = random.choices(range(num_options), weights=probabilities, k=1)[0]
        return selected_index


# Enums for testing
class TestPersona:
    """Test persona for debugging."""
    def __init__(self):
        self.risk_tolerance = 0.5
        self.brand_loyalty = 0.7
        self.price_sensitivity = 0.3
        self.innovation_openness = 0.6
        self.trust_in_institutions = 0.5
        self.social_influence = 0.5
        self.routine_preference = 0.5
        self.convenience_focus = 0.5
        self.quality_orientation = 0.5


if __name__ == "__main__":
    # Quick test
    test_persona = TestPersona()
    
    print("Likert responses (should be 1-5):")
    for i in range(10):
        score = QuantEngine.simulate_likert_response(test_persona, seed=i)
        print(f"  Response {i+1}: {score}")
    
    print("\nMCQ responses (options: ['Budget', 'Mid-range', 'Premium']):")
    options = ["Budget", "Mid-range", "Premium"]
    for i in range(10):
        idx = QuantEngine.simulate_mcq_response(test_persona, options, seed=i)
        print(f"  Response {i+1}: {options[idx]}")
